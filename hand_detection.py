"""
Real-time Hand Detection and Gesture Recognition System
Using MediaPipe Hands and OpenCV
"""

import cv2
import numpy as np
import mediapipe as mp
from collections import deque
from typing import Dict, List, Tuple, Optional
import math
import time

class HandDetector:
    """MediaPipe-based hand detection with gesture recognition"""
    
    def __init__(self, max_hands: int = 2, confidence: float = 0.5, model_complexity: int = 1):
        """
        Initialize hand detector
        
        Args:
            max_hands: Maximum number of hands to detect
            confidence: Detection confidence threshold (0-1)
            model_complexity: 0=lite, 1=full
        """
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=max_hands,
            min_detection_confidence=confidence,
            min_tracking_confidence=confidence,
            model_complexity=model_complexity
        )
        
        self.landmark_names = [
            'Wrist', 'Thumb_CMC', 'Thumb_MCP', 'Thumb_IP', 'Thumb_Tip',
            'Index_MCP', 'Index_PIP', 'Index_DIP', 'Index_Tip',
            'Middle_MCP', 'Middle_PIP', 'Middle_DIP', 'Middle_Tip',
            'Ring_MCP', 'Ring_PIP', 'Ring_DIP', 'Ring_Tip',
            'Pinky_MCP', 'Pinky_PIP', 'Pinky_DIP', 'Pinky_Tip'
        ]
        
        # Gesture history for smoothing
        self.gesture_history = deque(maxlen=10)
        self.hand_trails = {0: deque(maxlen=30), 1: deque(maxlen=30)}
        
        # Fingertip indices
        self.fingertips = [4, 8, 12, 16, 20]
        self.finger_names = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']

    def detect_hands(self, frame: np.ndarray) -> Tuple[np.ndarray, List[Dict]]:
        """
        Detect hands in frame
        
        Args:
            frame: Input frame (BGR)
            
        Returns:
            Processed frame, List of hand data dicts
        """
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w, c = frame.shape
        
        results = self.hands.process(frame_rgb)
        hands_data = []
        
        if results.multi_hand_landmarks and results.multi_handedness:
            for hand_idx, (landmarks, handedness) in enumerate(
                zip(results.multi_hand_landmarks, results.multi_handedness)
            ):
                hand_info = {
                    'id': hand_idx,
                    'handedness': handedness.classification[0].label,
                    'confidence': handedness.classification[0].score,
                    'landmarks': [],
                    'landmarks_px': [],
                }
                
                # Convert landmarks to pixel coordinates
                for lm in landmarks.landmark:
                    hand_info['landmarks'].append((lm.x, lm.y, lm.z))
                    hand_info['landmarks_px'].append((int(lm.x * w), int(lm.y * h)))
                
                # Calculate hand features
                hand_info['center'] = self._get_hand_center(hand_info['landmarks_px'])
                hand_info['bbox'] = self._get_bounding_box(hand_info['landmarks_px'])
                hand_info['gesture'] = self._recognize_gesture(hand_info['landmarks'])
                hand_info['fingertip_distances'] = self._get_fingertip_distances(hand_info['landmarks'])
                hand_info['volume_control'] = self._calculate_volume_level(hand_info['landmarks'])
                
                hands_data.append(hand_info)
                
                # Update trail
                if hand_idx < 2:
                    self.hand_trails[hand_idx].append(hand_info['center'])
        
        return frame, hands_data

    def _get_hand_center(self, landmarks_px: List[Tuple[int, int]]) -> Tuple[int, int]:
        """Calculate hand center point"""
        if not landmarks_px:
            return (0, 0)
        x_coords = [p[0] for p in landmarks_px]
        y_coords = [p[1] for p in landmarks_px]
        return (int(np.mean(x_coords)), int(np.mean(y_coords)))

    def _get_bounding_box(self, landmarks_px: List[Tuple[int, int]]) -> Tuple[int, int, int, int]:
        """Calculate hand bounding box (x1, y1, x2, y2)"""
        if not landmarks_px:
            return (0, 0, 0, 0)
        x_coords = [p[0] for p in landmarks_px]
        y_coords = [p[1] for p in landmarks_px]
        margin = 20
        return (
            max(0, min(x_coords) - margin),
            max(0, min(y_coords) - margin),
            max(x_coords) + margin,
            max(y_coords) + margin
        )

    def _recognize_gesture(self, landmarks: List[Tuple[float, float, float]]) -> Dict[str, any]:
        """Recognize hand gesture from landmarks"""
        
        # Get fingertip positions
        fingertips = [landmarks[i] for i in self.fingertips]
        
        # Calculate finger curl (0 = open, 1 = closed)
        curls = self._calculate_finger_curl(landmarks)
        
        # Calculate distances between key points
        thumb_index_dist = self._distance(landmarks[4], landmarks[8])
        thumb_middle_dist = self._distance(landmarks[4], landmarks[12])
        index_middle_dist = self._distance(landmarks[8], landmarks[12])
        
        # Gesture recognition logic
        gesture_name = "Unknown"
        confidence = 0.0
        
        # All fingers open - Open Palm
        if sum(curls) < 1.5:
            gesture_name = "Open Palm"
            confidence = 0.95
        
        # All fingers closed - Fist
        elif sum(curls) > 4.0:
            gesture_name = "Fist"
            confidence = 0.95
        
        # Thumb up - Thumbs Up
        elif curls[0] < 0.5 and sum(curls[1:]) > 3.5:
            # Check if thumb points upward
            if landmarks[4][1] < landmarks[3][1] < landmarks[2][1]:
                gesture_name = "Thumbs Up"
                confidence = 0.85
        
        # OK sign - Circle with thumb and index
        elif thumb_index_dist < 0.05 and sum(curls[1:]) < 2.0:
            gesture_name = "OK Sign"
            confidence = 0.90
        
        # Peace sign - Index and middle up, others closed
        elif curls[1] < 0.5 and curls[2] < 0.5 and curls[3] > 0.8 and curls[4] > 0.8:
            gesture_name = "Peace Sign"
            confidence = 0.90
        
        # Default to Open Palm if uncertain
        else:
            gesture_name = "Open Palm"
            confidence = 0.5
        
        return {
            'name': gesture_name,
            'confidence': confidence,
            'curls': curls
        }

    def _calculate_finger_curl(self, landmarks: List[Tuple[float, float, float]]) -> List[float]:
        """Calculate curl amount for each finger (0-1, where 1 = fully curled)"""
        curls = []
        
        # Finger structure: [MCP, PIP, DIP, Tip]
        finger_indices = [
            [2, 3, 4],      # Thumb
            [5, 6, 7, 8],   # Index
            [9, 10, 11, 12], # Middle
            [13, 14, 15, 16], # Ring
            [17, 18, 19, 20]  # Pinky
        ]
        
        for finger in finger_indices:
            # Distance from joint to tip
            tip_pos = landmarks[finger[-1]]
            
            # Calculate how much finger is curled
            distances = []
            for i in range(len(finger) - 1):
                d = self._distance(landmarks[finger[i]], tip_pos)
                distances.append(d)
            
            # Curl is based on tip proximity to earlier joints
            curl = 1.0 if min(distances) < 0.1 else 0.0
            curls.append(curl)
        
        return curls

    def _get_fingertip_distances(self, landmarks: List[Tuple[float, float, float]]) -> Dict[str, float]:
        """Get distances between fingertips"""
        distances = {}
        for i, name1 in enumerate(self.finger_names):
            for j, name2 in enumerate(self.finger_names):
                if i < j:
                    dist = self._distance(landmarks[self.fingertips[i]], landmarks[self.fingertips[j]])
                    distances[f"{name1}-{name2}"] = dist
        return distances

    def _calculate_volume_level(self, landmarks: List[Tuple[float, float, float]]) -> float:
        """Calculate volume level based on thumb-index distance (0-100)"""
        thumb_index_dist = self._distance(landmarks[4], landmarks[8])
        # Scale distance (0-0.3) to volume (0-100)
        volume = max(0, min(100, thumb_index_dist * 333))
        return volume

    @staticmethod
    def _distance(p1: Tuple[float, float, float], 
                  p2: Tuple[float, float, float]) -> float:
        """Calculate Euclidean distance between two 3D points"""
        return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2 + (p1[2] - p2[2])**2)

    def draw_hands(self, frame: np.ndarray, hands_data: List[Dict]) -> np.ndarray:
        """Draw hand landmarks and information on frame"""
        h, w = frame.shape[:2]
        
        for hand in hands_data:
            # Draw bounding box
            x1, y1, x2, y2 = hand['bbox']
            color = (0, 255, 0) if hand['handedness'] == 'Right' else (255, 0, 0)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            
            # Draw landmarks and connections
            landmarks_px = hand['landmarks_px']
            
            # Draw connections
            connections = [
                (0, 1), (1, 2), (2, 3), (3, 4),  # Thumb
                (0, 5), (5, 6), (6, 7), (7, 8),  # Index
                (0, 9), (9, 10), (10, 11), (11, 12),  # Middle
                (0, 13), (13, 14), (14, 15), (15, 16),  # Ring
                (0, 17), (17, 18), (18, 19), (19, 20)  # Pinky
            ]
            
            for start, end in connections:
                cv2.line(frame, landmarks_px[start], landmarks_px[end], color, 1)
            
            # Draw landmarks
            for idx, (x, y) in enumerate(landmarks_px):
                if idx in self.fingertips:
                    cv2.circle(frame, (x, y), 6, (0, 255, 255), -1)
                    cv2.putText(frame, str(idx), (x+8, y+8), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
                else:
                    cv2.circle(frame, (x, y), 4, color, -1)
            
            # Draw hand center
            cx, cy = hand['center']
            cv2.circle(frame, (cx, cy), 8, (0, 255, 255), -1)
            cv2.circle(frame, (cx, cy), 10, (0, 255, 255), 2)
            
            # Draw trail
            trail = self.hand_trails[hand['id']]
            for i in range(1, len(trail)):
                cv2.line(frame, trail[i-1], trail[i], (255, 100, 100), 1)
            
            # Draw gesture information
            gesture = hand['gesture']
            text = f"{hand['handedness']} - {gesture['name']} ({gesture['confidence']:.0%})"
            cv2.putText(frame, text, (x1, y1 - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            
            # Draw volume level
            volume = hand['volume_control']
            cv2.putText(frame, f"Volume: {volume:.0f}%", (x1, y2 + 25),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        return frame

    def get_mouse_position(self, hands_data: List[Dict]) -> Optional[Tuple[int, int]]:
        """Get mouse position from index fingertip (right hand preferred)"""
        if not hands_data:
            return None
        
        # Prefer right hand
        right_hand = None
        for hand in hands_data:
            if hand['handedness'] == 'Right':
                right_hand = hand
                break
        
        if not right_hand and hands_data:
            right_hand = hands_data[0]
        
        if right_hand:
            return right_hand['landmarks_px'][8]  # Index fingertip
        
        return None


class FallbackHandDetector:
    """Fallback hand detection using skin detection and contours"""
    
    def __init__(self):
        """Initialize fallback detector"""
        # HSV range for skin color
        self.lower_skin = np.array([0, 20, 70], dtype=np.uint8)
        self.upper_skin = np.array([20, 255, 255], dtype=np.uint8)
        
        self.hand_trails = {0: deque(maxlen=30), 1: deque(maxlen=30)}

    def detect_hands(self, frame: np.ndarray) -> Tuple[np.ndarray, List[Dict]]:
        """Detect hands using skin detection"""
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        mask = cv2.inRange(hsv, self.lower_skin, self.upper_skin)
        
        # Morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        
        # Find contours
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        hands_data = []
        
        for idx, contour in enumerate(sorted(contours, key=cv2.contourArea, reverse=True)[:2]):
            area = cv2.contourArea(contour)
            if area < 500:
                continue
            
            # Get bounding box
            x, y, w, h = cv2.boundingRect(contour)
            
            # Get convex hull for fingertip detection
            hull = cv2.convexHull(contour)
            fingers = len(hull) - 1  # Approximate finger count
            
            # Get hand center
            M = cv2.moments(contour)
            if M["m00"] > 0:
                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])
            else:
                cx, cy = x + w // 2, y + h // 2
            
            hand_info = {
                'id': idx,
                'handedness': 'Right' if idx == 0 else 'Left',
                'confidence': 0.6,
                'center': (cx, cy),
                'bbox': (x, y, x + w, y + h),
                'contour': contour,
                'hull': hull,
                'fingers': fingers,
                'gesture': {
                    'name': f"Hand ({fingers} fingers)",
                    'confidence': 0.6
                }
            }
            
            hands_data.append(hand_info)
            
            if idx < 2:
                self.hand_trails[idx].append((cx, cy))
        
        return frame, hands_data

    def draw_hands(self, frame: np.ndarray, hands_data: List[Dict]) -> np.ndarray:
        """Draw detected hands on frame"""
        for hand in hands_data:
            # Draw contour
            cv2.drawContours(frame, [hand['contour']], 0, (0, 255, 0), 2)
            
            # Draw convex hull
            cv2.drawContours(frame, [hand['hull']], 0, (255, 0, 0), 2)
            
            # Draw bounding box
            x1, y1, x2, y2 = hand['bbox']
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Draw center
            cv2.circle(frame, hand['center'], 8, (0, 255, 255), -1)
            
            # Draw trail
            trail = self.hand_trails[hand['id']]
            for i in range(1, len(trail)):
                cv2.line(frame, trail[i-1], trail[i], (255, 100, 100), 1)
            
            # Draw text
            text = f"{hand['handedness']} - {hand['gesture']['name']}"
            cv2.putText(frame, text, (x1, y1 - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        return frame


class GestureApp:
    """Main application for hand detection and gesture recognition"""
    
    def __init__(self, use_fallback: bool = False, camera_id: int = 0, 
                 fps_limit: int = 30, resolution: Tuple[int, int] = (1280, 720)):
        """
        Initialize gesture recognition app
        
        Args:
            use_fallback: Use fallback detector if True
            camera_id: Webcam ID
            fps_limit: Target FPS
            resolution: (width, height)
        """
        self.camera_id = camera_id
        self.fps_limit = fps_limit
        self.resolution = resolution
        self.use_fallback = use_fallback
        
        # Initialize detector
        try:
            if use_fallback:
                raise ImportError("Using fallback detector")
            self.detector = HandDetector(max_hands=2, confidence=0.5)
            self.detector_type = "MediaPipe"
        except:
            print("MediaPipe not available, using fallback detector")
            self.detector = FallbackHandDetector()
            self.detector_type = "Fallback (Skin Detection)"
        
        # Performance tracking
        self.frame_times = deque(maxlen=30)
        self.gesture_counts = {}

    def run(self):
        """Main application loop"""
        cap = cv2.VideoCapture(self.camera_id)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.resolution[0])
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.resolution[1])
        cap.set(cv2.CAP_PROP_FPS, 30)
        
        print(f"\n{'='*60}")
        print(f"Hand Detection & Gesture Recognition System")
        print(f"Detector: {self.detector_type}")
        print(f"Resolution: {self.resolution}")
        print(f"{'='*60}")
        print("\nControls:")
        print("  'q'     - Quit")
        print("  'f'     - Toggle fullscreen")
        print("  's'     - Save screenshot")
        print("  'r'     - Reset gesture counter")
        print("  'm'     - Toggle mouse control visualization")
        print("\n")
        
        fullscreen = False
        show_mouse = True
        frame_count = 0
        start_time = time.time()
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_start = time.time()
            
            # Flip for mirror view
            frame = cv2.flip(frame, 1)
            
            # Detect hands
            frame, hands_data = self.detector.detect_hands(frame)
            
            # Draw hands
            frame = self.detector.draw_hands(frame, hands_data)
            
            # Update gesture counter
            for hand in hands_data:
                gesture_name = hand['gesture']['name']
                self.gesture_counts[gesture_name] = self.gesture_counts.get(gesture_name, 0) + 1
            
            # Draw mouse position if enabled
            if show_mouse:
                mouse_pos = self.detector.get_mouse_position(hands_data)
                if mouse_pos:
                    cv2.circle(frame, mouse_pos, 15, (100, 200, 255), 2)
                    cv2.putText(frame, "MOUSE", (mouse_pos[0] - 30, mouse_pos[1] - 20),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 200, 255), 2)
            
            # Draw FPS
            frame_time = time.time() - frame_start
            self.frame_times.append(frame_time)
            fps = 1 / (sum(self.frame_times) / len(self.frame_times)) if self.frame_times else 0
            
            cv2.putText(frame, f"FPS: {fps:.1f}", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            # Draw hand count
            cv2.putText(frame, f"Hands Detected: {len(hands_data)}", (10, 70),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            # Draw gesture statistics
            stats_y = 110
            for gesture, count in sorted(self.gesture_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
                cv2.putText(frame, f"{gesture}: {count}", (10, stats_y),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
                stats_y += 30
            
            # Display frame
            if fullscreen:
                cv2.namedWindow('Hand Detection', cv2.WND_PROP_FULLSCREEN)
                cv2.setWindowProperty('Hand Detection', cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
            else:
                cv2.namedWindow('Hand Detection', cv2.WINDOW_NORMAL)
                cv2.resizeWindow('Hand Detection', self.resolution[0], self.resolution[1])
            
            cv2.imshow('Hand Detection', frame)
            
            # Handle keyboard input
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('f'):
                fullscreen = not fullscreen
            elif key == ord('s'):
                filename = f"screenshot_{int(time.time())}.png"
                cv2.imwrite(filename, frame)
                print(f"Screenshot saved: {filename}")
            elif key == ord('r'):
                self.gesture_counts.clear()
                print("Gesture counter reset")
            elif key == ord('m'):
                show_mouse = not show_mouse
                print(f"Mouse visualization: {'ON' if show_mouse else 'OFF'}")
            
            # FPS limiting
            elapsed = time.time() - frame_start
            sleep_time = max(0, 1/self.fps_limit - elapsed)
            if sleep_time > 0:
                time.sleep(sleep_time)
            
            frame_count += 1
        
        cap.release()
        cv2.destroyAllWindows()
        
        # Print summary
        print(f"\n{'='*60}")
        print("Session Summary:")
        print(f"Total frames: {frame_count}")
        print(f"Duration: {time.time() - start_time:.1f}s")
        print(f"Average FPS: {frame_count / (time.time() - start_time):.1f}")
        print(f"\nGesture Statistics:")
        for gesture, count in sorted(self.gesture_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"  {gesture}: {count} detections")
        print(f"{'='*60}\n")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Hand Detection and Gesture Recognition")
    parser.add_argument("--camera", type=int, default=0, help="Camera ID")
    parser.add_argument("--fps", type=int, default=30, help="Target FPS")
    parser.add_argument("--width", type=int, default=1280, help="Frame width")
    parser.add_argument("--height", type=int, default=720, help="Frame height")
    parser.add_argument("--fallback", action="store_true", help="Use fallback detector")
    
    args = parser.parse_args()
    
    app = GestureApp(
        use_fallback=args.fallback,
        camera_id=args.camera,
        fps_limit=args.fps,
        resolution=(args.width, args.height)
    )
    
    try:
        app.run()
    except KeyboardInterrupt:
        print("\n\nApplication interrupted by user")
