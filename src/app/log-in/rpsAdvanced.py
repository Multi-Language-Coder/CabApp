import random

def get_winner(player_choice, computer_choice):
    """
    Determines the winner of a single round of Rock, Paper, Scissors.
    Returns "player", "computer", or "tie".
    """
    if player_choice == computer_choice:
        return "tie"
    elif (player_choice == "rock" and computer_choice == "scissors") or \
         (player_choice == "scissors" and computer_choice == "paper") or \
         (player_choice == "paper" and computer_choice == "rock"):
        return "player"
    else:
        return "computer"

def get_computer_move(previous_user_move, previous_computer_move, last_round_outcome, round_number):
    """
    Calculates the computer's next move based on an empirically studied strategy.
    
    This strategy aims to exploit common human tendencies in Rock, Paper, Scissors:
    1. First Round: Computer plays Paper (as humans often start with Rock).
    2. If Computer Won the last round: Computer plays what the user just played.
       (This predicts the user might stick to their losing move or get confused by the mimicry).
    3. If Computer Lost the last round: Computer plays the move that beats what the user just played.
       (This predicts the user might stick to their winning move, and the computer counters it).
    4. If Computer Tied the last round: Computer plays the move that beats the move the computer just played (the tie move).
       (This attempts to break a potential predictable pattern from the tie).
    
    Args:
        previous_user_move (str): The user's choice in the previous round.
        previous_computer_move (str): The computer's choice in the previous round.
        last_round_outcome (str): The outcome of the last round from the computer's perspective 
                                  ("player" (computer lost), "computer" (computer won), "tie").
        round_number (int): The current round number.
                                  
    Returns:
        str: The computer's chosen move ("rock", "paper", or "scissors").
    """
    
    # Rule 1: First Round - Start with Paper
    if round_number == 1:
        return "paper" 

    # Define the winning relationships: move -> what it beats
    # This dictionary maps a move to the move that *beats* it.
    # E.g., beats["rock"] is "paper" because paper beats rock.
    beats = {
        "rock": "paper",
        "paper": "scissors",
        "scissors": "rock"
    }

    # Rule 2: If Computer Won the last round
    if last_round_outcome == "computer": 
        # Play what the opponent just used (e.g., if computer won with paper against rock,
        # it plays rock next, anticipating the human might stick to rock or be surprised).
        return previous_user_move
    
    # Rule 3: If Computer Lost the last round
    elif last_round_outcome == "player": 
        # Play the move that beats what the user just played (e.g., if user won with paper against computer's rock,
        # computer plays scissors next to beat user's potential repeated paper).
        return beats[previous_user_move]
    
    # Rule 4: If Computer Tied the last round
    else: # last_round_outcome == "tie"
        # Play the move that beats the move the computer just played (the tie move).
        # (e.g., if both played rock, computer plays paper next, anticipating the human might
        # try scissors or stick to rock, and aiming to break the pattern).
        return beats[previous_computer_move]

def main():
    """
    Main function to run the Rock, Paper, Scissors game in the console.
    """
    player_score = 0
    computer_score = 0
    rounds = 0
    
    # Variables to store the game state for the computer's strategy
    previous_user_move = None
    previous_computer_move = None
    last_round_outcome = None # Stores "player", "computer", or "tie" from the computer's perspective

    print("Welcome to Rock, Paper, Scissors!")
    print("The computer will try to use an empirically studied strategy based on human behavior.")
    print("Enter 'rock', 'paper', 'scissors' to play, or 'quit' to stop.")

    while True:
        rounds += 1
        print(f"\n--- Round {rounds} ---")
        
        # Get player's choice input and validate it
        player_choice = input("Your choice (rock, paper, scissors, or quit): ").lower()
        
        valid_choices = ["rock", "paper", "scissors", "quit"]
        while player_choice not in valid_choices:
            print("Invalid choice. Please enter 'rock', 'paper', 'scissors', or 'quit'.")
            player_choice = input("Your choice: ").lower()
        
        # Check if the player wants to quit
        if player_choice == "quit":
            break

        # Determine the computer's choice using the defined strategy
        if rounds == 1:
            # For the first round, there's no previous state
            computer_choice = get_computer_move(None, None, None, rounds)
        else:
            computer_choice = get_computer_move(previous_user_move, previous_computer_move, last_round_outcome, rounds)
        
        print(f"Computer chooses: {computer_choice}")

        # Determine the winner of the current round
        outcome = get_winner(player_choice, computer_choice)
        
        # Update scores and display the round result
        if outcome == "player":
            print("You win this round!")
            player_score += 1
        elif outcome == "computer":
            print("Computer wins this round!")
            computer_score += 1
        else:
            print("It's a tie!")
        
        # Update the state variables for the next round
        previous_user_move = player_choice
        previous_computer_move = computer_choice
        last_round_outcome = outcome

        print(f"Current Score: You {player_score} - Computer {computer_score}")

    print("\n--- Game Over ---")
    print(f"Final Score: You {player_score} - Computer {computer_score}")
    
    # Announce the overall game winner
    if player_score > computer_score:
        print("Congratulations! You won the game!")
    elif computer_score > player_score:
        print("The computer won the game!")
    else:
        print("The game ended in a tie!")

if __name__ == "__main__":
    main()

