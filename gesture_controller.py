"""
Advanced Gesture Control System
Features: Virtual keyboard, mouse control, volume adjustment, drawing
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple, Callable
from dataclasses import dataclass
from enum import Enum
import time

class ControlMode(Enum):
    """Available control modes"""
    MOUSE = "Mouse Control"
    VOLUME = "Volume Control"
    DRAWING = "Virtual Drawing"
    KEYBOARD = "Virtual Keyboard"


@dataclass
class VirtualMouse:
    """Virtual mouse control using hand landmarks"""
    
    sensitivity: float = 1.0
    smoothing: float = 0.7
    left_click_threshold: float = 0.05
    right_click_threshold: float = 0.08
    double_click_threshold: float = 0.3
    
    def __init__(self):
        self.prev_x = 0
        self.prev_y = 0
        self.smoothed_x = 0
        self.smoothed_y = 0
        self.left_click_time = 0
        self.right_click_time = 0

    def process(self, hand_data: Dict) -> Dict:
        """Process hand data for mouse control"""
        
        landmarks = hand_data['landmarks']
        landmarks_px = hand_data['landmarks_px']
        
        # Index finger tip for cursor position
        index_tip = landmarks_px[8]
        
        # Smooth cursor movement
        self.smoothed_x = self.prev_x * self.smoothing + index_tip[0] * (1 - self.smoothing)
        self.smoothed_y = self.prev_y * self.smoothing + index_tip[1] * (1 - self.smoothing)
        
        self.prev_x = self.smoothed_x
        self.prev_y = self.smoothed_y
        
        # Detect clicks based on thumb-index distance
        thumb_index_dist = self._distance(landmarks[4], landmarks[8])
        
        left_click = False
        right_click = False
        double_click = False
        
        if thumb_index_dist < self.left_click_threshold:
            left_click = True
            current_time = time.time()
            if current_time - self.left_click_time < self.double_click_threshold:
                double_click = True
            self.left_click_time = current_time
        
        # Right click: thumb-middle distance
        thumb_middle_dist = self._distance(landmarks[4], landmarks[12])
        if thumb_middle_dist < self.right_click_threshold:
            right_click = True
            self.right_click_time = time.time()
        
        return {
            'cursor_pos': (int(self.smoothed_x), int(self.smoothed_y)),
            'left_click': left_click,
            'right_click': right_click,
            'double_click': double_click,
            'scroll': self._calculate_scroll(landmarks)
        }

    def _calculate_scroll(self, landmarks: List) -> int:
        """Calculate scroll amount based on hand motion"""
        # This would require frame-to-frame tracking
        return 0

    @staticmethod
    def _distance(p1: Tuple, p2: Tuple) -> float:
        """Calculate distance between two points"""
        return ((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2 + (p1[2] - p2[2])**2) ** 0.5


@dataclass
class VolumeControl:
    """Volume control using thumb-index distance"""
    
    min_distance: float = 0.03
    max_distance: float = 0.15
    smoothing: float = 0.8

    def __init__(self):
        self.prev_volume = 0

    def process(self, hand_data: Dict) -> Dict:
        """Calculate volume level from hand gesture"""
        
        landmarks = hand_data['landmarks']
        
        # Distance between thumb and index finger
        thumb_index_dist = self._distance(landmarks[4], landmarks[8])
        
        # Map to volume (0-100%)
        normalized = (thumb_index_dist - self.min_distance) / (self.max_distance - self.min_distance)
        volume = max(0, min(100, normalized * 100))
        
        # Smooth volume changes
        smoothed_volume = self.prev_volume * self.smoothing + volume * (1 - self.smoothing)
        self.prev_volume = smoothed_volume
        
        return {
            'volume': int(smoothed_volume),
            'gesture_open': thumb_index_dist > self.max_distance,
            'gesture_closed': thumb_index_dist < self.min_distance
        }

    @staticmethod
    def _distance(p1: Tuple, p2: Tuple) -> float:
        """Calculate distance"""
        return ((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2 + (p1[2] - p2[2])**2) ** 0.5


class VirtualDrawing:
    """Virtual drawing using index finger"""
    
    def __init__(self, canvas_shape: Tuple[int, int] = (720, 1280)):
        self.canvas = np.zeros((canvas_shape[0], canvas_shape[1], 3), dtype=np.uint8)
        self.drawing = False
        self.prev_pos = None
        self.brush_size = 5
        self.brush_color = (0, 255, 255)
        self.strokes = []

    def process(self, hand_data: Dict) -> Dict:
        """Process drawing input"""
        
        landmarks = hand_data['landmarks']
        
        # Index finger for drawing
        index_tip = hand_data['landmarks_px'][8]
        
        # Check if index is extended (drawing mode)
        index_extended = landmarks[8][1] < landmarks[7][1]  # tip above DIP
        middle_extended = landmarks[12][1] < landmarks[11][1]  # check middle too
        
        drawing_active = index_extended and not middle_extended
        
        if drawing_active and self.prev_pos:
            cv2.line(self.canvas, self.prev_pos, index_tip, self.brush_color, self.brush_size)
            self.strokes.append((self.prev_pos, index_tip, self.brush_color, self.brush_size))
        
        self.prev_pos = index_tip if drawing_active else None
        
        return {
            'drawing_active': drawing_active,
            'current_pos': index_tip,
            'canvas': self.canvas.copy()
        }

    def clear_canvas(self):
        """Clear the drawing canvas"""
        self.canvas.fill(0)
        self.strokes.clear()

    def undo(self):
        """Undo last stroke"""
        if self.strokes:
            self.strokes.pop()
            self._redraw_canvas()

    def _redraw_canvas(self):
        """Redraw canvas from strokes"""
        self.canvas.fill(0)
        for start, end, color, size in self.strokes:
            cv2.line(self.canvas, start, end, color, size)


class VirtualKeyboard:
    """Virtual keyboard using hand gestures"""
    
    def __init__(self, frame_shape: Tuple[int, int] = (720, 1280)):
        self.frame_height, self.frame_width = frame_shape
        
        # Define keyboard layout
        self.keys = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ' '],
            ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '<-', 'ENTER', '']
        ]
        
        self.key_size = (self.frame_width // 10, 40)
        self.input_text = ""
        self.hover_key = None
        self.last_click_time = 0
        self.click_debounce = 0.5

    def process(self, hand_data: Dict) -> Dict:
        """Process keyboard input from hand tracking"""
        
        # Index finger for selecting keys
        index_tip = hand_data['landmarks_px'][8]
        
        # Find which key is being hovered
        self.hover_key = self._get_key_at_position(index_tip)
        
        # Detect click (thumb-index touch)
        landmarks = hand_data['landmarks']
        thumb_index_dist = ((landmarks[4][0] - landmarks[8][0])**2 + 
                          (landmarks[4][1] - landmarks[8][1])**2 + 
                          (landmarks[4][2] - landmarks[8][2])**2) ** 0.5
        
        clicked_key = None
        current_time = time.time()
        
        if thumb_index_dist < 0.05 and (current_time - self.last_click_time) > self.click_debounce:
            self.last_click_time = current_time
            if self.hover_key:
                clicked_key = self.hover_key
                self._process_key_click(clicked_key)
        
        return {
            'input_text': self.input_text,
            'hover_key': self.hover_key,
            'clicked_key': clicked_key,
            'keyboard_layout': self.keys
        }

    def _get_key_at_position(self, pos: Tuple[int, int]) -> str:
        """Get key at given position"""
        x, y = pos
        
        # Calculate which row and column
        row = y // 50  # Approximate row height
        col = x // (self.frame_width // 10)
        
        if 0 <= row < len(self.keys) and 0 <= col < len(self.keys[row]):
            return self.keys[row][col]
        
        return None

    def _process_key_click(self, key: str):
        """Process key press"""
        if key == '<-':
            self.input_text = self.input_text[:-1]
        elif key == 'ENTER':
            self.input_text += '\n'
        else:
            self.input_text += key

    def draw_keyboard(self, frame: np.ndarray) -> np.ndarray:
        """Draw virtual keyboard on frame"""
        
        y_offset = frame.shape[0] - 200
        
        for row_idx, row in enumerate(self.keys):
            y = y_offset + row_idx * 50
            
            for col_idx, key in enumerate(row):
                x = col_idx * (self.frame_width // 10)
                
                # Highlight hovered key
                if self.hover_key == key:
                    color = (0, 255, 0)
                    thickness = 2
                else:
                    color = (255, 255, 255)
                    thickness = 1
                
                # Draw key box
                cv2.rectangle(frame, (x, y), (x + self.frame_width // 10, y + 40),
                            color, thickness)
                
                # Draw key label
                cv2.putText(frame, key, (x + 10, y + 28),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        
        # Draw input area
        cv2.rectangle(frame, (0, y_offset - 40), (self.frame_width, y_offset),
                     (100, 100, 100), -1)
        cv2.putText(frame, f"Input: {self.input_text}", (10, y_offset - 10),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        
        return frame


class GestureController:
    """Unified gesture control system"""
    
    def __init__(self, detector):
        self.detector = detector
        self.mode = ControlMode.MOUSE
        
        self.virtual_mouse = VirtualMouse()
        self.volume_control = VolumeControl()
        self.virtual_drawing = VirtualDrawing()
        self.virtual_keyboard = VirtualKeyboard()

    def process(self, hand_data: Dict) -> Dict:
        """Process hand data with current control mode"""
        
        result = {
            'mode': self.mode,
            'hand_data': hand_data
        }
        
        if self.mode == ControlMode.MOUSE:
            result.update(self.virtual_mouse.process(hand_data))
        elif self.mode == ControlMode.VOLUME:
            result.update(self.volume_control.process(hand_data))
        elif self.mode == ControlMode.DRAWING:
            result.update(self.virtual_drawing.process(hand_data))
        elif self.mode == ControlMode.KEYBOARD:
            result.update(self.virtual_keyboard.process(hand_data))
        
        return result

    def switch_mode(self, mode: ControlMode):
        """Switch control mode"""
        self.mode = mode
        print(f"Switched to: {mode.value}")

    def draw_ui(self, frame: np.ndarray, control_data: Dict) -> np.ndarray:
        """Draw control UI on frame"""
        
        if self.mode == ControlMode.DRAWING:
            # Overlay drawing canvas
            alpha = 0.7
            frame = cv2.addWeighted(frame, alpha, 
                                   self.virtual_drawing.canvas, 1 - alpha, 0)
        
        elif self.mode == ControlMode.KEYBOARD:
            frame = self.virtual_keyboard.draw_keyboard(frame)
        
        elif self.mode == ControlMode.MOUSE:
            if 'cursor_pos' in control_data:
                cursor = control_data['cursor_pos']
                cv2.circle(frame, cursor, 10, (100, 200, 255), 2)
                cv2.circle(frame, cursor, 5, (100, 200, 255), -1)
        
        elif self.mode == ControlMode.VOLUME:
            if 'volume' in control_data:
                volume = control_data['volume']
                bar_width = 200
                bar_height = 30
                x, y = frame.shape[1] - bar_width - 20, 30
                
                # Draw volume bar
                cv2.rectangle(frame, (x, y), (x + bar_width, y + bar_height),
                            (100, 100, 100), -1)
                fill_width = int(bar_width * volume / 100)
                cv2.rectangle(frame, (x, y), (x + fill_width, y + bar_height),
                            (0, 255, 0), -1)
                cv2.rectangle(frame, (x, y), (x + bar_width, y + bar_height),
                            (255, 255, 255), 2)
                
                cv2.putText(frame, f"Volume: {volume}%", (x, y - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        
        # Draw mode indicator
        cv2.putText(frame, f"Mode: {self.mode.value}", (10, frame.shape[0] - 20),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        
        return frame


if __name__ == "__main__":
    print("Advanced Gesture Control module loaded successfully")
