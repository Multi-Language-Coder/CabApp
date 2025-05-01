var1 = [9,1,6,8,2,7,2,5]
count = 0
for i in range(len(var1)):
    if var1[i] == 2:
        count = count + 1

print("The number of 2s in the list is:",count)