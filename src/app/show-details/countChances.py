allResults = ["Catepillar",
"Catepillar",
"Catepillar",
"Catepillar",
"Catepillar",
"Catepillar",
"Catepillar",
"Catepillar",
"Catepillar",
"Catepillar",
"Dragonfly",
"Giant Ant",
"Giant Ant",
"Giant Ant",
"Giant Ant",
"Giant Ant",
"Giant Ant",
"Giant Ant",
"Giant Ant",
"Giant Ant",
"Giant Ant",
"Giant Ant",
"Giant Ant",
"Giant Ant",
"Giant Ant",
"Giant Ant",
"Giant Ant",
"Giant Ant",
"Giant Ant",
"Giant Ant",
"Praying Mantis",
"Praying Mantis",
"Praying Mantis",
"Snail",
"Snail",
"Snail",
"Snail",
"Snail",
"Snail",
"Snail",
"Snail",
"Snail",
"Snail",
"Snail",
"Snail",
"Snail",
"Snail",
"Snail"]
snailCt = 0
catepillarCt = 0
antCt = 0
mantisCt = 0
dfCt = 0
for i in range(len(allResults)):
    if allResults[i] == "Snail":
        snailCt = snailCt+1
    elif allResults[i] == "Catepillar":
        catepillarCt = catepillarCt+1
    elif allResults[i] == "Giant Ant":
        antCt = antCt+1
    elif allResults[i] == "Praying Mantis":
        mantisCt = mantisCt+1
    elif allResults[i] == "Dragonfly":
        dfCt = dfCt+1

ttlCt = snailCt+catepillarCt+antCt+mantisCt+dfCt
print(f"Snail: {(snailCt/ttlCt)*100}%\nCatepillar: {(catepillarCt/ttlCt)*100}%\nGiant Ant: {(antCt/ttlCt)*100}%\nPraying Mantis: {(mantisCt/ttlCt)*100}%\nDragonfly: {(dfCt/ttlCt)*100}%")