import os
import json
file_path="C:\\Ruder-Buster\\CabApp\\src\\app\\update\\todoList.txt"
if os.path.exists(file_path):
    with open(file_path,"r") as file:
        toDoList=json.loads(file.read())
        for activity in toDoList:
            print(f"Activity: {activity.activity}, Status: {activity.status}")
        change=input("Have you finished any tasks (y or n)?")
        if change == "y":
            which = input("Which task do you want to change (Activity Name): ")
            for activity in toDoList:
                if activity.activity.lower() == which:
                    
        while True:
            apartTodo=input("What do you wish to add to your to-do list?")
            todo = {
                "activity":apartTodo,
                "status":"Unfinished"
            }
            toDoList.append(todo)
    

else:
    with open(file_path,"w") as file:    
        end = False
        toDoList=[
        ]
        while end==False:
            apartTodo=input("What do you wish to add to your to-do list?....")
            todo = {
                "activity":apartTodo,
                "status":"Unfinished"
            }
            toDoList.append(todo)
            finish = input("Are you done adding stuff (y or n)?...")
            if finish == "y":
                end = True
        file.write(str(toDoList))
        print("Please re-run program to see results")


