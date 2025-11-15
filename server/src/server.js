import express from 'express'
import cors from 'cors'
import zlib from 'zlib'
import Redis from 'ioredis'
import multer from 'multer'
import http from 'http'

const app = express()
app.use(cors())

const redis = new Redis({
  host: "redis",
  port: 6379,
})
const TRAJECTORY_KEY = 'trajectory_data'

const server = http.createServer(app)
const upload = multer({ storage: multer.memoryStorage() })

// Trajectory endpoints ----------------------------------------------------------

app.post('/trajectories', express.raw({ type: '*/*', limit: '200mb' }), async (req, res) => {
  try {
    const compressedBuffer = req.body
    console.log('Received compressed trajectory data:', compressedBuffer.length, 'bytes')

    const compressedBase64 = compressedBuffer.toString('base64')
    await redis.set(TRAJECTORY_KEY, compressedBase64)

    res.json({ status: 'stored_and_broadcasted' })
  } catch (err) {
    console.error('Error storing trajectory:', err)
    res.status(500).json({ error: 'Failed to store trajectory' })
  }
})

app.get('/trajectories', async (req, res) => {
  try {
    const compressedBase64 = await redis.get(TRAJECTORY_KEY)
    if (!compressedBase64) return res.json({ trajectory: [] })

    const buffer = Buffer.from(compressedBase64, 'base64')
    zlib.gunzip(buffer, (err, decoded) => {
      if (err) {
        console.error('Decompression error:', err)
        return res.status(500).json({ error: 'Failed to decompress trajectory data' })
      }

      try {
        const data = JSON.parse(decoded.toString())
        res.json(data)
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr)
        res.status(500).json({ error: 'Failed to parse trajectory JSON' })
      }
    })
  } catch (err) {
    console.error('Unexpected error in /latest:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Image endpoints ----------------------------------------------------------

app.post('/image', upload.single('image'), async (req, res) => {
  console.log('Received image upload request')
  try {
    const { name, area } = req.body
    const file = req.file

    if (!file || !name || !area) {
      return res.status(400).json({ error: 'Missing image, name, or area' })
    }

    let areaObj
    try {
      areaObj = JSON.parse(area)
    } catch (err) {
      return res.status(400).json({ error: 'Invalid area JSON' })
    }

    const imageData = {
      name,
      area: areaObj,
      mimeType: file.mimetype,
      data: file.buffer.toString('base64'),
      timestamp: Date.now(),
    }

    await redis.set(`image:${name}`, JSON.stringify(imageData))
    res.json({ status: 'image_stored', key: `image:${name}` })
  } catch (err) {
    console.error('Error storing image:', err)
    res.status(500).json({ error: 'Failed to store image' })
  }
})

app.get('/image/:name', async (req, res) => {
  try {
    const { name } = req.params
    const json = await redis.get(`image:${name}`)
    if (!json) return res.status(404).json({ error: 'Image not found' })

    const imageData = JSON.parse(json)
    res.json(imageData)
  } catch (err) {
    console.error('Error retrieving image:', err)
    res.status(500).json({ error: 'Failed to retrieve image' })
  }
})

//  ----------------------------------------------------------

app.get("/tiles/:z/:x/:y.png", async (req, res) => {
  const { z, x, y } = req.params;
  const url = `https://maps.omniscale.net/v2/private-william-woldum-2c115f59/style.default/${z}/${x}/${y}.png`;

  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  console.log(response);

  res.set("Content-Type", "image/png");
  res.set("Access-Control-Allow-Origin", "*");
  res.send(Buffer.from(buffer));
});


app.get('/', (req, res) => {
  res.send('Trajectory Server is running')
})

const PORT = 4000
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
