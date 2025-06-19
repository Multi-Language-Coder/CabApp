from random import choice
finished = False
def checkWin(dec1,dec2):
    if dec1 == dec2:
        return "No one wins"
    elif dec1 == "scissors" and dec2 == "paper":
        return "Player Wins"       
    elif dec1 == "rock" and dec2 == "scissors":
        return "Player Wins"
    elif dec1 == "paper" and dec2 == "rock":
        return "Player Wins"
    elif dec2 == "scissors" and dec1 == "paper":
        return "Bot Wins"       
    elif dec2 == "rock" and dec1 == "scissors":
        return "Bot Wins"
    elif dec2 == "paper" and dec1 == "rock":
        return "Bot Wins" 
decisions = ["rock","paper","scissors"]
while(finished == False):
    plyr1 = input("Please enter rock, paper or scissor: ")
    botChoice = choice(decisions)
    winner = checkWin(plyr1,botChoice)
    print(f"The bot chose: {botChoice}")
    print(winner)
    contin = input("Continue the game? (y or n): ")
    if contin == "n":
        finished = True
    elif contin == "y":
        finished = False
    else:
        print("The game will continue due to your response")