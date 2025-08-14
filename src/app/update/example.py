import ast
with open("C:\\Ruder-Buster\\CabApp\\src\\app\\update\\todoList.txt","r") as file:
    stringified_list_python_literal =file.read()
    actual_list_python_literal = ast.literal_eval(stringified_list_python_literal)
    print(actual_list_python_literal)