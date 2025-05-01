import numpy as np

import matplotlib.pyplot as plt
import matplotlib.animation as animation

# Initialize the figure
fig, ax = plt.subplots()
ax.set_xlim(0, 10)
ax.set_ylim(0, 10)
ax.set_aspect('equal')

# Stickman 1
stickman1, = ax.plot([], [], 'b-', lw=2)
stickman1_head, = ax.plot([], [], 'bo', markersize=10)

# Stickman 2
stickman2, = ax.plot([], [], 'r-', lw=2)
stickman2_head, = ax.plot([], [], 'ro', markersize=10)

# Function to draw a stickman
def draw_stickman(x, y, facing_left=True):
    body = [
        (x, y), (x, y - 1),  # Head to torso
        (x - 0.5, y - 2), (x, y - 1),  # Left arm
        (x + 0.5, y - 2),  # Right arm
        (x, y - 1), (x - 0.5, y - 3),  # Left leg
        (x, y - 1), (x + 0.5, y - 3)  # Right leg
    ]
    if not facing_left:
        body = [(2 * x - px, py) for px, py in body]  # Flip horizontally
    return zip(*body)

# Animation update function
def update(frame):
    # Stickman 1 moves left and punches
    x1, y1 = 3 + 0.1 * np.sin(frame / 5), 6
    stickman1.set_data(*draw_stickman(x1, y1, facing_left=True))
    stickman1_head.set_data(x1, y1)

    # Stickman 2 moves right and dodges
    x2, y2 = 7 - 0.1 * np.sin(frame / 5), 6
    stickman2.set_data(*draw_stickman(x2, y2, facing_left=False))
    stickman2_head.set_data(x2, y2)

    return stickman1, stickman1_head, stickman2, stickman2_head

# Create the animation
ani = animation.FuncAnimation(fig, update, frames=100, interval=50, blit=True)

# Show the animation
plt.show()