// Clean Web Speech API onresult handler

function computeTranscript(event, baseText) {
  let sessionFinal = '';
  let sessionInterim = '';

  for (let i = 0; i < event.results.length; ++i) {
    const item = event.results[i];
    const text = item[0].transcript.trim();
    if (item.isFinal) {
      sessionFinal += text + ' ';
    } else {
      sessionInterim += text + ' ';
    }
  }

  const parts = [baseText, sessionFinal.trim(), sessionInterim.trim()].filter(Boolean);
  return parts.join(' ');
}

// Stream of simulated events as user speaks "اختلال هرزه خواری در کودکان"
const events = [
  { results: [[{ transcript: "اختلال", isFinal: false }]] },
  { results: [[{ transcript: "اختلال هرزه", isFinal: false }]] },
  { results: [[{ transcript: "اختلال هرزه خواری", isFinal: false }]] },
  { results: [[{ transcript: "اختلال هرزه خواری", isFinal: true }]] },
  { results: [[{ transcript: "اختلال هرزه خواری", isFinal: true }], [{ transcript: "در", isFinal: false }]] },
  { results: [[{ transcript: "اختلال هرزه خواری", isFinal: true }], [{ transcript: "در کودکان", isFinal: false }]] },
  { results: [[{ transcript: "اختلال هرزه خواری", isFinal: true }], [{ transcript: "در کودکان", isFinal: true }]] }
];

const base = "توضیح اولیه:";
events.forEach((ev, idx) => {
  const text = computeTranscript(ev, base);
  console.log(`Event ${idx + 1}:`, text);
});
