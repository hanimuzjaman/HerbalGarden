// This function fetches herbal remedy information from the Gemini API
async function searchGemini() {
  // Set API key from input field
  const apiKey = document.getElementById("apiKey").value.trim();
  const GEMINI_API_KEY = apiKey;

  const query = document.getElementById("searchBox").value.trim();
  const outputBox = document.getElementById("output");
  const queryType = document.getElementById("queryType").value;

  // Validate user input
  if (!query) {
    outputBox.innerHTML = "<strong>Please enter a value.</strong>";
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Build the prompt based on the query type (plant or disease)
  let promptText = "";
  // The number of responses to request from the API
  let candidateCount = 1;

  if (queryType === "plant") {
    // Plant: Request a single response containing multiple remedies
    promptText = `
You are an expert herbalist. For the plant "${query}", provide 3 DIFFERENT remedies in a single HTML response.  
For each remedy, clearly indicate which disease it treats.  

Format example:
🌿 <strong>Plant Name:</strong> ${query}  
🩺 <strong>Used For Disease:</strong> ...  
🧪 <strong>Remedy Preparation (Step-by-step):</strong>
<p><em>Ingredients</em></p>
<ul><li>...</li></ul>
<p><em>Steps</em></p>
<ol>
  <li>...</li>
  <li>...</li>
</ol>

Rules:
- Include all 3 remedies in **one single HTML response**.  
- HTML only (p, ul, ol, li, strong, em). No markdown.
    `;
    candidateCount = 1;
  } else {
    // Disease: Request 3 separate, distinct responses
    promptText = `
You are an expert herbalist. For the disease "${query}", generate 3 DIFFERENT remedies.  
Each response should follow this format:

🩺 <strong>Disease Name:</strong> ${query}  
🌿 <strong>Beneficial Plants:</strong>
<ul><li>...</li></ul>
🧪 <strong>Remedy Preparation (Step-by-step):</strong>
<p><em>Ingredients</em></p>
<ul><li>...</li></ul>
<p><em>Steps</em></p>
<ol>
  <li>...</li>
  <li>...</li>
</ol>

Rules:
- Give 3 varied responses (different plant combinations or remedies).  
- Return them as separate text candidates so they can be displayed individually.  
- HTML only (p, ul, ol, li, strong, em). No markdown.
    `;
    candidateCount = 3;
  }

  const requestData = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      candidateCount: candidateCount,
      temperature: 0.8,
    },
  };

  // Show a loader while waiting for the API response
  outputBox.innerHTML = '<div class="loader"></div>';

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();
    let candidates = data?.candidates || [];

    // Filter out any empty or non-meaningful responses
    const meaningfulCandidates = candidates.filter((c) => {
      const text = c?.content?.parts?.map((p) => p.text)?.join(" ") || "";
      return text.trim().length > 0;
    });

    // Clear the loader
    outputBox.innerHTML = "";

    // Handle case where no results are found
    if (meaningfulCandidates.length === 0) {
      outputBox.innerHTML = `<strong>No information found for "${query}". Please try another plant or disease.</strong>`;
      return;
    }

    // Loop through and display each candidate in its own block
    meaningfulCandidates.forEach((c) => {
      let text = c?.content?.parts?.map((p) => p.text)?.join(" ") || "";
      text = text
        .replace(/```(?:html)?/gi, "")
        .replace(/```/g, "")
        .trim();

      outputBox.innerHTML += `
        <div class="response-block">
          ${text}
        </div>
      `;
    });

    // Add a disclaimer for disease searches
    if (queryType === "disease") {
      outputBox.innerHTML += `
        <div class="disclaimer-box">
          ⚠️ <strong class="disclaimer">Disclaimer</strong>: This information is for educational purposes only.  
          Always consult a qualified doctor before using any remedy.
        </div>
      `;
    }
  } catch (error) {
    console.error("Fetch error:", error);
    outputBox.innerHTML =
      "<strong>Error fetching data. Check your API key or internet connection.</strong>";
  }
}
