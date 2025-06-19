import requests
import os
import datetime
os.system('cls' if os.name == 'nt' else 'clear')
url = "https://growagardenapi.vercel.app/api/stock/GetStock";
url1 = "https://growagardenapi.vercel.app/api/GetWeather"
response = requests.get(url)

stocks = response.json()["Data"]











3.

gearStock = stocks["gear"]
fruitStock = stocks["seeds"]
eggStock = stocks["egg"]
honeyStock = stocks["honey"]
print("Seeds in Stock")
for seed in fruitStock:
    if seed["name"] == "Mushroom":
        print("* Fruit: \033[1;31m"+seed["name"]+"\033[0m, Stock:"+str(seed["stock"]))
    elif seed["name"] == "Beanstalk":
        print("* Fruit: \033[1;32m"+seed["name"]+"\033[0m, Stock:"+str(seed["stock"]))
    elif seed["name"] == "Ember Lily":
        print("* Fruit: \033[1;33m"+seed["name"]+"\033[0m, Stock:"+str(seed["stock"]))
    elif seed["name"] == "Pepper":
        print("* Fruit: \033[31m"+seed["name"]+"\033[0m, Stock:"+str(seed["stock"]))
    elif seed["name"] == "Grape":
        print("* Fruit: \033[35m"+seed["name"]+"\033[0m, Stock:"+str(seed["stock"]))
    elif seed["name"] == "Mango":
        print("* Fruit: \033[33m"+seed["name"]+"\033[0m, Stock:"+str(seed["stock"]))
    else:
        print("* Fruit: "+seed["name"]+", Stock:"+str(seed["stock"]))

print("\nGear Shop")
for gear in gearStock:
    if gear["name"] == "Master Sprinkler":
        print("* Gear: \033[32m"+gear["name"]+"\033[0m, Stock:"+str(seed["stock"]))
    elif gear["name"] == "Godly Sprinkler":
        print("* Gear: \033[1;32m"+gear["name"]+"\033[0m, Stock:"+str(seed["stock"]))
    elif gear["name"] == "Lightning Rod":
        print("* Gear: \033[1;33m"+gear["name"]+"\033[0m, Stock:"+str(seed["stock"]))
    else:
        print("* Gear: "+gear["name"]+", Stock:"+str(gear["stock"]))

print("\n Egg Shop")
for egg in eggStock:
    if egg["name"] == "Bug Egg":
        print("* Egg: \033[32m"+egg["name"]+"\033[0m")
    else:
        print("* Egg: "+egg["name"])
    
print("\n Honey Shop")
for item in honeyStock:
    if item["name"] == "Bee Egg":
         print("*\033[41m Honey Item: "+item["name"]+", Stock:"+str(item["stock"])+"\033[0m")
    else:
         print("* Honey Item: "+item["name"]+", Stock:"+str(item["stock"]))

"""activeWeathers = "The current active weathers are: "
for weather in weathers:
    if weather["active"] == True:
        activeWeathers += weather["weather_id"]+","
print(f"\n{activeWeathers}")"""
# using now() to get current time
current_time = datetime.datetime.now()
# Printing stock of now.
print("Time At Which has been requested is at:", current_time)