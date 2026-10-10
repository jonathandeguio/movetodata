export const getDefaultFavicon = (): string => {
  return "/favicons/movetodataLogo.svg";
};

function getFaviconByResourceId(resourceId: string) {
  console.log(resourceId);

  // get icon based on resourceId and give icon based on type

  return "/favicons/datasetParquetIcon.svg";
}

let spinInterval: number | undefined;

function favIconLoading(loading: boolean) {
  let favicon = document.querySelector('link[rel="icon"]') as any;

  // Clear any existing interval to prevent multiple spins
  if (spinInterval !== undefined) {
    clearInterval(spinInterval);
    spinInterval = undefined;
  }

  if (loading) {
    let rotation = 0;
    const spinInterval = setInterval(() => {
      rotation += 1; // Adjust the rotation speed as needed

      favicon.href = spinFavicon("left");
    }, 1);
    setTimeout(() => {
      favicon.setAttribute("href", getDefaultFavicon());
      clearInterval(spinInterval);
    }, 10); // Adjust the interval as needed
  } else {
    // Optionally, you can stop the spinning after a certain duration
    favicon.setAttribute("href", getDefaultFavicon());
    // Adjust the duration as needed
  }
}

// function getDefaultFavicon(): string {
//   // Base64-encoded default image
//   return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAOXRFWHRTb2Z0d2FyZQBNYXRwbG90bGliIHZlcnNpb24zLjQuMywgaHR0cHM6Ly9tYXRwbG90bGliLm9yZy/MnkTPAAAACXBIWXMAAB7CAAAewgFu0HU+AAEAAElEQVR4nOzdeXQTZfv/8VeZmZmZmZmZmZvpsDcMjgHEFBRFQXARERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERHwQXQ1FdnOEicAAAAASUVORK5CYII=";

//   // Replace this with your default favicon's base64 string
// }

function createImage(src: string): HTMLImageElement {
  const img = new Image();
  img.src = src;
  return img;
}

function spinFavicon(direction: string) {
  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;

  if (favicon) {
    let rotation = 0;
    const spinInterval = setInterval(() => {
      rotation += 10; // Adjust the rotation speed as needed

      const rotatedFavicon = getRotatedFavicon(direction, rotation);
      favicon.href = rotatedFavicon;
    }, 50); // Adjust the interval as needed

    spinInterval;

    // Optionally, you can stop the spinning after a certain duration
    setTimeout(() => {
      clearInterval(spinInterval);
      favicon.href = getDefaultFavicon();
    }, 1000); // Adjust the duration as needed
  }
}

function getRotatedFavicon(direction: string, rotation: number): string {
  // Base64-encoded rotated image based on direction
  const rotatedImage = getBase64Image(direction);

  // Apply rotation using a canvas
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const context = canvas.getContext("2d");

  if (context) {
    context.translate(8, 8);
    context.rotate((rotation * Math.PI) / 180);
    context.drawImage(createImage(rotatedImage), -8, -8, 16, 16);

    // Return the rotated image as a data URL
    return canvas.toDataURL("image/png");
  }

  // Return the default favicon if there's an issue with the rotation
  return getDefaultFavicon();
}

function getBase64Image(direction: string): string {
  // Define base64-encoded images based on direction
  const images: { [key: string]: string } = {
    topLeft:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAYxJREFUWEftlF1OwkAUhc+d6TLoXoaFaAQRaeKjD761TTTyoAGkISY+uBTqWgrrGHM7HaSBhg6x4WWaNP2Zac+53/0hXPigC+vD2cBoWSgpKRaAkoRckgZJQAL8s58AyKd3Yd42sFYGbmaFkgHFkkgJ0hAECAFzJUCW9/yeQKT708E/GWBhIoqFgPoT1ZBERnDPhDXyOghbBWUJNW4uxYVYs5CJcO+snvk98bpdk8hfrsN+W/y876gBI07rn agVZNykc5JIAwBvVa6fvgvFzwiA56v2+BsNDBZbbSKvUJuc54HW6TxyEzhF44DAcFYkxFW+K7QScZpFYXLqZ+es1wwMF9uESMf1nOvOxA9ScLvcrLm/bXVzn2dRz6moXCnUCIwzk3uLP5v0nFrKVbxGYLwsEhKc+6rPodOPjvK+b3 QX4WRV4bfFB53O77spvKMGotVGm4FiJtx87DbRzsFfS8HD54YHTzlyuQveR93nv3EQPX4Vyk65cyNr+13nVX7KiDfgCXgCnoAn4Al4Ar9w/GMhQHyTSwAAAABJRU5ErkJggg==",
    left: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAddJREFUWEftltFKG1EQhv9/TvoWBl9l9yF6kYuAkWgNWNoiiEUhG1Qs1JKmKgZCe6GCFz7E5lXsic9xZPZkQ1Y3XuVsbgwsuZxv5v//OUOs+McV18c7wJsT2OjbSIDo37d6EkqqhQBanCKp0OEDXTz8XB+HgCgF8MWZCoHsE4Di4mFn+RClAK3Bk9POjRD670Fc77KzfCleAWz2bULDbt55BkIEKa6SFgA2B08J6bpGpqMP2HnupwJAe 2ATCruquU7ABBr7vJlnAO0LGwm96/PxX+6sBV9UswLbF9PuM80Jgev9CWC6l1GeAexc2UQ4Zz643u9Py3f9QoDO9SQ1QJRJIECNiM+3lp/7hQC7w4nLF4+m4Fc7vP6FGH4Z2pSiE/AJOG/XgxuwAPB1NEkNEdEvHpCIf7QqlGBvZF PST0AlMEB8UiXA/l+bMEuBN6EIxsfNehziBSxdRAcjG7GGNJNg+ggRjJNmWBkKRju8sakeIFMPwBiMjxphp1AAOLq1kYGb3QHqBcL1vjfWq7uIju/yOKoX/D2gj9LexzAQpVk/vf+fLSWVQgFIVAtwdm8jY7wUKkGo7l8dJPPx+Pn wmAiAkMXfBAid/9KLqKqipYtoFcXfJdAJPAN0rYkhGQ36ewAAAABJRU5ErkJggg==",
    bottomleft:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAdtJREFUWEftlstKHEEUhv//lHmLjL5K9RMkEFy4EIyMiYMJUXShRJhuVBQ0eBljBmYTouDChfgEPa+iNT5HhdNtj2lmvCym2ixs6G2fr/7LqSZe+OELz8crwKsCQxWY2Xf291KtW0VABwB0OEVSEd99A5+0v4YFGQCY3XcxDZtCQAQw8MnJQi0OpUYJYPbwNiZ90wiQAWSvT44bFQHUD11MYVNPrsNN4OGqal+BestZoaRCn59cgOP5t8Fr2 h/wqXV3enoYEgKfHAWUvshUH2D+p4uF9+FTgIPP4bwfAGic9LzJQ5fJP0ZEe3NhK1jKwJd2zxfJ1xb8qIf3vwTwre1SCmwBsVevBQ9gCWCx00sNYZmFECAR7Xys0ILljkvJXAG1wADRZpUAKx1njWG+B3QRCbob07Uo1AoeaMFqx1 mOIc0sEGZtIBjF02FtKAXt+x+XCmDvMgBj0F2fCqtCCWD91FkDn/5bR8Ina1MT1dyG6svGWVFHzUJuhV5Ky5NhIIZ2fev8JltK95uRIH2y9GH0EEMBts+1EWUrClsW3o+PdEE9+LHdC2cNFUJbkS0mVSRpvButCk+epnXpFMLqn9G oh5dW8WML59fVdRxi+LMBQm7DJy0IOfy/UOAvScOJIUQlXKIAAAAASUVORK5CYII=",

    topRight:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAaZJREFUWEftlD9Lw1AUxc+9L1+jVj+JyVDUwaGgQ8UiDhUFQR0cBCGpDg46CAU7dFAHcRAU7NDxxU9S2vRr6JP3XlNa/5UISZcEQpIhOb+cc+4lzPigGesjMUCtMZAsACZAABCkQPoZeGMAV7VCkOSnEgPs3gwkAy6zhTAg5l6BicxVMOoa5mxrOkxigL1mJAXINYJjEDEIGQALwlB1v1r805HEAPvNKGAmf0Jw6EQMJAigMWcI5J1UCuFP0 SQG0B85bEWuY/MeffT0NgrIwSJDuZPR2JiIyTte/w7xL4BpJTt/iALByudhFNoRJgqP1gre13dTAdAiF4+9QJiodFdsJ4hRPyhPdiI1AA1x+dQLBJFvp2R4qndvr7wwii5VAA1x/dyXgpRrSmmKSeHO6twoitQBGi+RHllp9wNBj6 kjPrztFetC6gBapPnal2Y64oXFKmOAdtd1iGXcBUEUVpdtDJk40Gp3XWaWdkGZVY3NpXmjnQmAFrrr9NRoEhjYKBWzBbjvdAMGQscBKqUMx3Da1swsgt9AcoDcgdyB3IHcgdyBmTvwCVGeZiEN+evTAAAAAElFTkSuQmCC",
    right:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAdhJREFUWEftl71KA0EQx2dm8xom5kHUO0FRQpBIBBVT2AgWFhYWFpI7IljYCBYWNkrQEwQDpggScM8nuST3HDqyu+YSjGK1q4WBI+X8/h9zwyH88g9/eT78A1h3oNFMvaPaVPxd1FYBjqNUErCHwOHhRiH4CsIaQOM2lQLZIwRQDxL6B2uTTlgBaESpJ4AlEQIhg/iA2K/mJ+ZZAVBWn0T9QBDWFUAGQhjvVfL+eBTWANSQ0/t+IBDrgkwM+ uFXf7dSzEppFUBBnD0MdBcQQUchCOOd8sgF6wDnrdQjZKm7QAiIDDnx5m8vGxesA6ghF48DvY6ko2AgwHC7ZNbSDUA78XJIctgFgRjXlkwMTgAu24lHRFJ1QEUgBMRbi9PuAJTSq06fs00ggM2FghbvxAE16LrT4/F1XF+YdgfQ7C QeEslhCQVBvDbvMILmU6JfSAYAgAjiqu8Q4Kar3ohcF2huAyGHFb/obg3vuj3O1CPDql/Mume9hFE3CXL6KGnrtfqVOaPe+hao4eYimuz1FgCHZRcARjl9nONh+Tgsz4zUW3Xg/rknEUAdIn2E1H95dpS9kwhacU8SKgiTfemTeqs ODBW2X5JAle+r4U4Afvrysr6G/wB/3oF33ieJIYturygAAAAASUVORK5CYII=",
    bottomRight:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAX9JREFUWEftV1FKw0AQnbebXkObg1Q3QtGfIBUFET1LklP4IaIi2gMUCZKP5CZrL+LK7CZtqdWPmmw/TCCQzcfOm/fezDCgHT/YcXzqAfQM9Az0DPQM/A8GbmdaBZBJIIlARkmgujnZi3gOeWPg/m1uJIgAQ1IQXR8PbWxvAB7zuREgsq8guhrv+wXwlH8YzrwGUV2Oh/4keM61ghAlZy6cBNXFkU8A7zqVQOIAWAmq88gjgJdinkqYRAKWA QGTTaIw9WLCaaEVCDX9ToKzKFyYv/MqmBY6DQSSxv2c/emhy75zBji4bIKDbP0LMlnsA4DLXCRW8xXzxSNnvs4YqDVnxytX81x2znzxwVL7VgFwnfOFQSAT4FNxy11q7r4JJopHYbW+h2xtwruZVgMpyqa3rwfks+t8hhv+xuB/Mu FDrpWEKFfcTYs6/0Xz1hhgAAMBB6AeMI3mgUQFmGwT5a0B4IteC55wrrfbUUsm4/+T6LvWP+2gW3ugraV25wC+AM58aSFxCK6NAAAAAElFTkSuQmCC",
  };

  return images[direction] || getDefaultFavicon();
}

// Simplified cycling function that returns the next image each time it's called
let currentIndex = 0; // Moved outside to maintain state
function getNextFaviconImage() {
  const images = [
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAYxJREFUWEftlF1OwkAUhc+d6TLoXoaFaAQRaeKjD761TTTyoAGkISY+uBTqWgrrGHM7HaSBhg6x4WWaNP2Zac+53/0hXPigC+vD2cBoWSgpKRaAkoRckgZJQAL8s58AyKd3Yd42sFYGbmaFkgHFkkgJ0hAECAFzJUCW9/yeQKT708E/GWBhIoqFgPoT1ZBERnDPhDXyOghbBWUJNW4uxYVYs5CJcO+snvk98bpdk8hfrsN+W/y876gBI07rn agVZNykc5JIAwBvVa6fvgvFzwiA56v2+BsNDBZbbSKvUJuc54HW6TxyEzhF44DAcFYkxFW+K7QScZpFYXLqZ+es1wwMF9uESMf1nOvOxA9ScLvcrLm/bXVzn2dRz6moXCnUCIwzk3uLP5v0nFrKVbxGYLwsEhKc+6rPodOPjvK+b3 QX4WRV4bfFB53O77spvKMGotVGm4FiJtx87DbRzsFfS8HD54YHTzlyuQveR93nv3EQPX4Vyk65cyNr+13nVX7KiDfgCXgCnoAn4Al4Ar9w/GMhQHyTSwAAAABJRU5ErkJggg==",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAddJREFUWEftltFKG1EQhv9/TvoWBl9l9yF6kYuAkWgNWNoiiEUhG1Qs1JKmKgZCe6GCFz7E5lXsic9xZPZkQ1Y3XuVsbgwsuZxv5v//OUOs+McV18c7wJsT2OjbSIDo37d6EkqqhQBanCKp0OEDXTz8XB+HgCgF8MWZCoHsE4Di4mFn+RClAK3Bk9POjRD670Fc77KzfCleAWz2bULDbt55BkIEKa6SFgA2B08J6bpGpqMP2HnupwJAe 2ATCruquU7ABBr7vJlnAO0LGwm96/PxX+6sBV9UswLbF9PuM80Jgev9CWC6l1GeAexc2UQ4Zz643u9Py3f9QoDO9SQ1QJRJIECNiM+3lp/7hQC7w4nLF4+m4Fc7vP6FGH4Z2pSiE/AJOG/XgxuwAPB1NEkNEdEvHpCIf7QqlGBvZF PST0AlMEB8UiXA/l+bMEuBN6EIxsfNehziBSxdRAcjG7GGNJNg+ggRjJNmWBkKRju8sakeIFMPwBiMjxphp1AAOLq1kYGb3QHqBcL1vjfWq7uIju/yOKoX/D2gj9LexzAQpVk/vf+fLSWVQgFIVAtwdm8jY7wUKkGo7l8dJPPx+Pn wmAiAkMXfBAid/9KLqKqipYtoFcXfJdAJPAN0rYkhGQ36ewAAAABJRU5ErkJggg==",

    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAdtJREFUWEftlstKHEEUhv//lHmLjL5K9RMkEFy4EIyMiYMJUXShRJhuVBQ0eBljBmYTouDChfgEPa+iNT5HhdNtj2lmvCym2ixs6G2fr/7LqSZe+OELz8crwKsCQxWY2Xf291KtW0VABwB0OEVSEd99A5+0v4YFGQCY3XcxDZtCQAQw8MnJQi0OpUYJYPbwNiZ90wiQAWSvT44bFQHUD11MYVNPrsNN4OGqal+BestZoaRCn59cgOP5t8Fr2 h/wqXV3enoYEgKfHAWUvshUH2D+p4uF9+FTgIPP4bwfAGic9LzJQ5fJP0ZEe3NhK1jKwJd2zxfJ1xb8qIf3vwTwre1SCmwBsVevBQ9gCWCx00sNYZmFECAR7Xys0ILljkvJXAG1wADRZpUAKx1njWG+B3QRCbob07Uo1AoeaMFqx1 mOIc0sEGZtIBjF02FtKAXt+x+XCmDvMgBj0F2fCqtCCWD91FkDn/5bR8Ina1MT1dyG6svGWVFHzUJuhV5Ky5NhIIZ2fev8JltK95uRIH2y9GH0EEMBts+1EWUrClsW3o+PdEE9+LHdC2cNFUJbkS0mVSRpvButCk+epnXpFMLqn9G oh5dW8WML59fVdRxi+LMBQm7DJy0IOfy/UOAvScOJIUQlXKIAAAAASUVORK5CYII=",

    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAaZJREFUWEftlD9Lw1AUxc+9L1+jVj+JyVDUwaGgQ8UiDhUFQR0cBCGpDg46CAU7dFAHcRAU7NDxxU9S2vRr6JP3XlNa/5UISZcEQpIhOb+cc+4lzPigGesjMUCtMZAsACZAABCkQPoZeGMAV7VCkOSnEgPs3gwkAy6zhTAg5l6BicxVMOoa5mxrOkxigL1mJAXINYJjEDEIGQALwlB1v1r805HEAPvNKGAmf0Jw6EQMJAigMWcI5J1UCuFP0 SQG0B85bEWuY/MeffT0NgrIwSJDuZPR2JiIyTte/w7xL4BpJTt/iALByudhFNoRJgqP1gre13dTAdAiF4+9QJiodFdsJ4hRPyhPdiI1AA1x+dQLBJFvp2R4qndvr7wwii5VAA1x/dyXgpRrSmmKSeHO6twoitQBGi+RHllp9wNBj6 kjPrztFetC6gBapPnal2Y64oXFKmOAdtd1iGXcBUEUVpdtDJk40Gp3XWaWdkGZVY3NpXmjnQmAFrrr9NRoEhjYKBWzBbjvdAMGQscBKqUMx3Da1swsgt9AcoDcgdyB3IHcgdyBmTvwCVGeZiEN+evTAAAAAElFTkSuQmCC",

    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAdhJREFUWEftl71KA0EQx2dm8xom5kHUO0FRQpBIBBVT2AgWFhYWFpI7IljYCBYWNkrQEwQDpggScM8nuST3HDqyu+YSjGK1q4WBI+X8/h9zwyH88g9/eT78A1h3oNFMvaPaVPxd1FYBjqNUErCHwOHhRiH4CsIaQOM2lQLZIwRQDxL6B2uTTlgBaESpJ4AlEQIhg/iA2K/mJ+ZZAVBWn0T9QBDWFUAGQhjvVfL+eBTWANSQ0/t+IBDrgkwM+ uFXf7dSzEppFUBBnD0MdBcQQUchCOOd8sgF6wDnrdQjZKm7QAiIDDnx5m8vGxesA6ghF48DvY6ko2AgwHC7ZNbSDUA78XJIctgFgRjXlkwMTgAu24lHRFJ1QEUgBMRbi9PuAJTSq06fs00ggM2FghbvxAE16LrT4/F1XF+YdgfQ7C QeEslhCQVBvDbvMILmU6JfSAYAgAjiqu8Q4Kar3ohcF2huAyGHFb/obg3vuj3O1CPDql/Mume9hFE3CXL6KGnrtfqVOaPe+hao4eYimuz1FgCHZRcARjl9nONh+Tgsz4zUW3Xg/rknEUAdIn2E1H95dpS9kwhacU8SKgiTfemTeqs ODBW2X5JAle+r4U4Afvrysr6G/wB/3oF33ieJIYturygAAAAASUVORK5CYII=",

    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAX9JREFUWEftV1FKw0AQnbebXkObg1Q3QtGfIBUFET1LklP4IaIi2gMUCZKP5CZrL+LK7CZtqdWPmmw/TCCQzcfOm/fezDCgHT/YcXzqAfQM9Az0DPQM/A8GbmdaBZBJIIlARkmgujnZi3gOeWPg/m1uJIgAQ1IQXR8PbWxvAB7zuREgsq8guhrv+wXwlH8YzrwGUV2Oh/4keM61ghAlZy6cBNXFkU8A7zqVQOIAWAmq88gjgJdinkqYRAKWA QGTTaIw9WLCaaEVCDX9ToKzKFyYv/MqmBY6DQSSxv2c/emhy75zBji4bIKDbP0LMlnsA4DLXCRW8xXzxSNnvs4YqDVnxytX81x2znzxwVL7VgFwnfOFQSAT4FNxy11q7r4JJopHYbW+h2xtwruZVgMpyqa3rwfks+t8hhv+xuB/Mu FDrpWEKFfcTYs6/0Xz1hhgAAMBB6AeMI3mgUQFmGwT5a0B4IteC55wrrfbUUsm4/+T6LvWP+2gW3ugraV25wC+AM58aSFxCK6NAAAAAElFTkSuQmCC",
  ];

  const currentImage = images[currentIndex];
  currentIndex = (currentIndex + 1) % images.length; // Loop back to the first image after the last
  return currentImage;
}

export { favIconLoading, getFaviconByResourceId };
