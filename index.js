const express = require('express');
const { mongodb, MongoClient, ServerApiVersion } = require('mongodb')
const app = express();
const port = 3000;
const cors = require('cors');
const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config()

app.use(cors())
app.use(express.json())

// Setting up MongoDB
const uri = `mongodb+srv://msaad53407:%23Pmc2022ecby47%23@mymongo.wfepn6f.mongodb.net/?retryWrites=true&w=majority`
const dbName = 'MyGptDB'

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Main route to send prompt reply to frontend
app.post('/', async (req, res) => {
    console.log('fetchingAnswer')
    try {
        const { prompt } = req.body

        // Function to get Data from OpenAI and POST to frontend and add the prompt to database
        const callOpenAiApi = async () => {
            const configuration = new Configuration({
                apiKey: process.env.OPENAI_API_KEY,
            });
            const openai = new OpenAIApi(configuration);
            const completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [{ "role": "system", "content": "You friend of user" }, { role: "user", content: `${prompt}` }],
            });
            chats.insertOne({
                message: prompt,
                reply: completion.data.choices[0].message.content
            })
            res.status(200).json({
                bot: completion.data.choices[0].message.content
            })
        }

        //Connecting to MongoDB
        const result = await client.connect();
        await client.db(dbName).command({ ping: 1 })
        console.log('Connected to MongoDB Successfully')

        const db = result.db(dbName)
        const chats = db.collection('chats')
        const promptCheck = await chats.find({}).toArray()

        //Getting reply of prompt from database and sending to frontend
        if (promptCheck.length === 0) callOpenAiApi();
        else {
            let chatFound = false;
            for (const chat of promptCheck) {
                if (chat.message.toLowerCase() === prompt || chat.message.toUpperCase() === prompt || chat.message === prompt) {
                    res.status(200).json({
                        bot: chat.reply
                    })
                    chatFound = true;
                    break;
                }
            }
            if (!chatFound) callOpenAiApi();
        }
    }
    catch (error) {
        client.close()
        res.status(500).send('Something Went Wrong')
    } finally {
        console.log('Connection to MongoDB ended Successfully')
    }

})

// Route to send userData to frontend
app.get('/download', async (req, res) => {
    try {
        const result = await client.connect();
        await client.db(dbName).command({ ping: 1 })
        console.log('Connected to MongoDB Successfully')

        const db = result.db(dbName)
        const userInfoCollection = db.collection('userInfo')
        const userInfo = await userInfoCollection.find({}).toArray()

        if (userInfo.length === 0) res.status(200).json({ info: 'No User Found' })

        res.status(200).json({ info: { userName: userInfo[0].userName, userSrc: userInfo[1].src } })
    } catch (error) {
        res.status(500).send(error)
    }
    console.log('nameSend')
})

//Route to update userData in database
app.post('/upload', async (req, res) => {
    try {
        const { newName } = req.body
        const result = await client.connect();
        await client.db(dbName).command({ ping: 1 })
        console.log('Connected to MongoDB Successfully')

        const db = result.db(dbName)
        const userInfoCollection = db.collection('userInfo')

        await userInfoCollection.findOneAndReplace({ name: 'UserData' }, { name: 'UserData', userName: newName })
        const userNameInfo = await userInfoCollection.find({}).toArray()
        res.status(200).json({ info: userNameInfo[0].userName })
    } catch (error) {
        client.close()
        res.status(500).json({ info: error })
    } finally {
        client.close()
        console.log('Connection to MongoDB ended Successfully')
    }
    console.log("nameUpdate")
})

app.post('/iconUpdate', async (req, res) => {
    try {
        const { newIconSrc } = req.body
        const result = await client.connect();
        await client.db(dbName).command({ ping: 1 })
        console.log('Connected to MongoDB Successfully')

        const db = result.db(dbName)
        const userInfoCollection = db.collection('userInfo')

        await userInfoCollection.findOneAndReplace({ name: 'userIcon' }, { name: 'userIcon', src: newIconSrc })

        res.status(200).json({ info: 'Icon Changed Successfully' })
    } catch (error) {
        client.close()
        res.status(500).json({ info: error })
    } finally {
        client.close()
        console.log('Connection to MongoDB ended Successfully')
    }
    console.log('IconUpdate')
})
app.get('/', (req, res) => {
    res.status(200).send('Hello World')
})

app.listen(port, () => {
    console.log(`listening at port http://localhost:${port}`)
})

