export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end()
  
    const { inputs } = req.body
  
    const prompt = `You are helping an artisan from Northeast India list their handmade product on Bihaan marketplace.
  
  Artisan details:
  - Name: ${inputs.artisanName}
  - Village: ${inputs.village}
  - State: ${inputs.state}
  - Experience: ${inputs.experience}
  - Product: ${inputs.productName}
  - Category: ${inputs.category}
  - Material: ${inputs.material}
  - Time to make: ${inputs.timeTomake}
  - Technique: ${inputs.technique || 'Traditional methods'}
  
  Respond ONLY with a valid JSON object, no markdown:
  {
    "title": "product title under 60 characters",
    "description": "warm authentic 100-130 word story about the artisan and product",
    "features": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5"],
    "meta": "SEO description under 160 characters"
  }`
  
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 }
          })
        }
      )
  
      const data = await response.json()
  
      if (!response.ok) {
        return res.status(500).json({ error: data?.error?.message || 'Gemini error' })
      }
  
      const text = data.candidates[0].content.parts[0].text
      const clean = text.replace(/```json|```/g, '').trim()
      const result = JSON.parse(clean)
      res.status(200).json(result)
  
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }