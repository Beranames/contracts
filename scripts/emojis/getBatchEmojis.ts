import emojis from "./list";

function* getEmojiBatch() {
  let i = 0;
  const batchSize = 50;
  while (i < emojis.length) {
    yield emojis.slice(i, i + batchSize);
    i += batchSize;
  }
}

export default getEmojiBatch;
