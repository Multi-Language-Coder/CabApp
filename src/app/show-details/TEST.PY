grid = [[{"key":"a1","value":"none"},{"key":"a2","value":"none"},{"key":"a3","value":"none"}],
        [{"key":"b1","value":"none"},{"key":"b2","value":"none"},{"key":"b3","value":"none"}],
        [{"key":"c1","value":"none"},{"key":"c2","value":"none"},{"key":"c3","value":"none"}]]
ifWon = False
ifBotWon = False
blankSlate = """    
             |                  |
             |                  |
        --------------------------------
             |                  |
             |                  |
        --------------------------------[]
             |                  |
             |                  |
      """
print(blankSlate)
while ifWon != True or ifBotWon != True:
    inp = input("What is your move?")