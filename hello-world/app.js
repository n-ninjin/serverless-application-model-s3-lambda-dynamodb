'use strict'

const AWS = require('aws-sdk')

// Set AWS region based on environment variable
AWS.config.region = process.env.AWS_REGION 

// Initialize S3 and DynamoDB clients
const s3 = new AWS.S3()
const docClient = new AWS.DynamoDB.DocumentClient()

// Generate unique identifiers
const { v4: uuidv4 } = require('uuid')

// Get DynamoDB table name from environment variable
const ddbTable = process.env.DDBtable

// The Lambda handler
exports.handler = async (event) => {
  console.log (JSON.stringify(event, null, 2))
  console.log('Using DynamoDB table:', ddbTable)

  // Loop through each record in the incoming S3 event
  await Promise.all(
    event.Records.map(async (record) => {
      try {
        console.log('Incoming record: ', record)

        // Get original text from object in incoming event
        const originalText = await s3.getObject({
          Bucket: record.s3.bucket.name,
          Key: record.s3.object.key // Set S3FileKey parameter from record
        }).promise()

        // Upload JSON to DynamoDB
        const jsonData = JSON.parse(originalText.Body.toString('utf-8'))
        await ddbLoader(jsonData, record.s3.object.key) // Pass S3FileKey parameter to ddbLoader

      } catch (err) {
        console.error(err)
      }
    })
  )
}

// Load JSON data to DynamoDB table
const ddbLoader = async (data, s3FileKey) => {
  // Separate into batches for upload
  let batches = []
  const BATCH_SIZE = 30

  while (data.length > 0) {
    batches.push(data.splice(0, BATCH_SIZE))
  }

  console.log(`Total batches: ${batches.length}`)

  let batchCount = 0

  // Save each batch
  await Promise.all(
    batches.map(async (item_data) => {

      // Set up the params object for the DynamoDB call
      const params = {
        RequestItems: {}
      }
      params.RequestItems[ddbTable] = []
  
      // Loop through each item in the batch
      item_data.forEach(item => {
        for (let key of Object.keys(item)) {
          // An AttributeValue may not contain an empty string
          if (item[key] === '') 
            delete item[key]
        }

        // Build params for item
        params.RequestItems[ddbTable].push({
          PutRequest: {
            Item: {
              ID: uuidv4(), // Generate unique identifier for item
              S3FileKey: s3FileKey, // Add S3 file path
              ...item // Add all properties from item to DynamoDB item
            }
          }
        })
      })

       // Upload the batch to DynamoDB
      try {
        batchCount++
        console.log('Trying batch: ', batchCount)
        const result = await docClient.batchWrite(params).promise()
        console.log('Success: ', result)
      } catch (err) {
        console.error('Error: ', err)
      }
    })
  )
}
