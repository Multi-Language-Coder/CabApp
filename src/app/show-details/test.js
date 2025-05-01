function timeFromTimestamp(timestamp) {
  const date = new Date(timestamp);

  // Use toLocaleTimeString() to get the current time in the user's locale
  const timeString = date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true // Use 12-hour format with AM/PM
  });

  return timeString;
}

const someTime = 1678886400000; // Example timestamp (March 15, 2023 10:40:00 AM)
const convertedTime = timeFromTimestamp(someTime);
console.log("Converted Time:", convertedTime);
