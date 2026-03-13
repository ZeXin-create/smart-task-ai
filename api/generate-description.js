// api/generate-description.js
export default async function handler(req, res) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { title } = req.body
  if (!title) {
    return res.status(400).json({ error: 'Title is required' })
  }

  const apiKey = process.env.ZHIPU_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    // 调用智谱API（OpenAI兼容模式）[citation:1]
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'glm-4-flash',  // 免费模型，速度较快
        messages: [
          {
            role: 'system',
            content: '你是一个任务管理助手。根据用户输入的任务标题，生成一段详细的任务描述，包括目标、关键步骤和注意事项。描述要简洁实用，50-100字左右。'
          },
          {
            role: 'user',
            content: title
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    })

    const data = await response.json()
    
    // 智谱API返回格式与OpenAI一致
    if (data.choices && data.choices[0]) {
      res.status(200).json({ description: data.choices[0].message.content })
    } else {
      res.status(500).json({ error: 'AI response format error' })
    }
  } catch (error) {
    console.error('AI API error:', error)
    res.status(500).json({ error: 'Failed to generate description' })
  }
}