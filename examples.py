"""
Example Usage: Hand Detection & Gesture Control
Demonstrates various uses of the hand detection system
"""

import cv2
from hand_detection import HandDetector, GestureApp, FallbackHandDetector
from gesture_controller import GestureController, ControlMode, VirtualMouse, VolumeControl


def example_1_basic_detection():
    """Example 1: Basic hand detection with display"""
    print("\n" + "="*60)
    print("Example 1: Basic Hand Detection")
    print("="*60)
    print("\nThis example shows basic hand detection and gesture recognition")
    print("Features:")
    print("  - Real-time hand landmark detection")
    print("  - Gesture recognition (Fist, Palm, Peace, etc.)")
    print("  - Hand center tracking with trails")
    print("  - Confidence scoring")
    print("\nRunning...\n")
    
    app = GestureApp(use_fallback=False, fps_limit=30, resolution=(1280, 720))
    app.run()


def example_2_mouse_control():
    """Example 2: Virtual mouse control"""
    print("\n" + "="*60)
    print("Example 2: Virtual Mouse Control")
    print("="*60)
    print("\nThis example demonstrates virtual mouse control")
    print("Features:")
    print("  - Index finger controls cursor position")
    print("  - Thumb-index touch = left click")
    print("  - Thumb-middle touch = right click")
    print("  - Double-tap detection")
    print("\nRunning...\n")
    
    detector = HandDetector(max_hands=1)
    controller = GestureController(detector)
    controller.switch_mode(ControlMode.MOUSE)
    
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame = cv2.flip(frame, 1)
        frame, hands = detector.detect_hands(frame)
        frame = detector.draw_hands(frame, hands)
        
        if hands:
            control = controller.process(hands[0])
            frame = controller.draw_ui(frame, control)
            
            if control.get('left_click'):
                print("LEFT CLICK detected!")
            if control.get('right_click'):
                print("RIGHT CLICK detected!")
        
        cv2.imshow('Virtual Mouse Control', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()


def example_3_volume_control():
    """Example 3: Volume control using hand distance"""
    print("\n" + "="*60)
    print("Example 3: Volume Control")
    print("="*60)
    print("\nThis example shows volume control via hand gesture")
    print("Features:")
    print("  - Thumb-index distance = volume level")
    print("  - 0% = thumb and index together")
    print("  - 100% = hand fully open")
    print("  - Real-time volume bar display")
    print("\nRunning...\n")
    
    detector = HandDetector(max_hands=1)
    controller = GestureController(detector)
    controller.switch_mode(ControlMode.VOLUME)
    
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame = cv2.flip(frame, 1)
        frame, hands = detector.detect_hands(frame)
        frame = detector.draw_hands(frame, hands)
        
        if hands:
            control = controller.process(hands[0])
            frame = controller.draw_ui(frame, control)
            
            volume = control.get('volume', 0)
            print(f"\rVolume: {volume}%", end="")
        
        cv2.imshow('Volume Control', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    print()  # New line after progress
    cap.release()
    cv2.destroyAllWindows()


def example_4_gesture_statistics():
    """Example 4: Collect gesture statistics"""
    print("\n" + "="*60)
    print("Example 4: Gesture Statistics Collection")
    print("="*60)
    print("\nThis example collects statistics about detected gestures")
    print("Features:")
    print("  - Real-time gesture counting")
    print("  - Gesture frequency display")
    print("  - Statistics summary at end")
    print("\nRunning... (Press 'q' to quit)\n")
    
    detector = HandDetector(max_hands=2)
    gesture_stats = {}
    frame_count = 0
    
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame = cv2.flip(frame, 1)
        frame, hands = detector.detect_hands(frame)
        frame = detector.draw_hands(frame, hands)
        
        # Collect gesture statistics
        for hand in hands:
            gesture_name = hand['gesture']['name']
            gesture_stats[gesture_name] = gesture_stats.get(gesture_name, 0) + 1
        
        # Display statistics on frame
        stats_y = 50
        cv2.putText(frame, "Gesture Statistics:", (10, stats_y),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        stats_y += 35
        
        for gesture, count in sorted(gesture_stats.items(), key=lambda x: x[1], reverse=True):
            cv2.putText(frame, f"{gesture}: {count}", (10, stats_y),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            stats_y += 30
        
        cv2.imshow('Gesture Statistics', frame)
        frame_count += 1
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    # Print final statistics
    print("\n" + "="*60)
    print("Final Gesture Statistics:")
    print("="*60)
    for gesture, count in sorted(gesture_stats.items(), key=lambda x: x[1], reverse=True):
        print(f"  {gesture}: {count} detections")
    print(f"\nTotal frames processed: {frame_count}")
    print("="*60)
    
    cap.release()
    cv2.destroyAllWindows()


def example_5_custom_gesture_detection():
    """Example 5: Custom gesture recognition"""
    print("\n" + "="*60)
    print("Example 5: Custom Gesture Detection")
    print("="*60)
    print("\nThis example shows how to implement custom gestures")
    print("Detects: Rock, Paper, Scissors")
    print("\nRunning...\n")
    
    def detect_rps(hand):
        """Rock-Paper-Scissors detection"""
        curls = hand['gesture']['curls']
        
        if sum(curls) > 4.5:
            return "ROCK"
        elif sum(curls) < 1.5:
            return "PAPER"
        elif curls[1] < 0.5 and curls[2] < 0.5 and curls[3] > 0.8 and curls[4] > 0.8:
            return "SCISSORS"
        else:
            return "UNKNOWN"
    
    detector = HandDetector(max_hands=1)
    rps_stats = {}
    
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame = cv2.flip(frame, 1)
        frame, hands = detector.detect_hands(frame)
        frame = detector.draw_hands(frame, hands)
        
        if hands:
            rps = detect_rps(hands[0])
            rps_stats[rps] = rps_stats.get(rps, 0) + 1
            
            color = (0, 255, 0) if rps != "UNKNOWN" else (0, 0, 255)
            cv2.putText(frame, f"RPS: {rps}", (10, 50),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.5, color, 3)
        
        cv2.imshow('Rock-Paper-Scissors', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    print("\nRock-Paper-Scissors Statistics:")
    for move, count in sorted(rps_stats.items(), key=lambda x: x[1], reverse=True):
        print(f"  {move}: {count}")
    
    cap.release()
    cv2.destroyAllWindows()


def example_6_multi_hand_tracking():
    """Example 6: Multi-hand tracking and comparison"""
    print("\n" + "="*60)
    print("Example 6: Multi-Hand Tracking")
    print("="*60)
    print("\nThis example tracks both hands simultaneously")
    print("Features:")
    print("  - Detect up to 2 hands")
    print("  - Track each hand independently")
    print("  - Compare hand positions and gestures")
    print("\nRunning... (Show both hands to camera)\n")
    
    detector = HandDetector(max_hands=2)
    
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame = cv2.flip(frame, 1)
        frame, hands = detector.detect_hands(frame)
        frame = detector.draw_hands(frame, hands)
        
        # Display hand information
        info_y = 50
        cv2.putText(frame, f"Hands Detected: {len(hands)}", (10, info_y),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        for i, hand in enumerate(hands):
            info_y += 40
            text = f"Hand {i+1} ({hand['handedness']}): {hand['gesture']['name']}"
            cv2.putText(frame, text, (10, info_y),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 1)
        
        cv2.imshow('Multi-Hand Tracking', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()


def main():
    """Main example menu"""
    print("\n" + "="*60)
    print("Hand Detection & Gesture Recognition Examples")
    print("="*60)
    print("\nChoose an example to run:")
    print("  1. Basic Hand Detection")
    print("  2. Virtual Mouse Control")
    print("  3. Volume Control")
    print("  4. Gesture Statistics")
    print("  5. Custom Gesture (Rock-Paper-Scissors)")
    print("  6. Multi-Hand Tracking")
    print("  0. Exit")
    print()
    
    choice = input("Enter your choice (0-6): ").strip()
    
    examples = {
        '1': example_1_basic_detection,
        '2': example_2_mouse_control,
        '3': example_3_volume_control,
        '4': example_4_gesture_statistics,
        '5': example_5_custom_gesture_detection,
        '6': example_6_multi_hand_tracking,
    }
    
    if choice in examples:
        try:
            examples[choice]()
        except KeyboardInterrupt:
            print("\n\nExample interrupted by user")
    elif choice == '0':
        print("\nGoodbye!")
    else:
        print("\nInvalid choice")


if __name__ == "__main__":
    main()
