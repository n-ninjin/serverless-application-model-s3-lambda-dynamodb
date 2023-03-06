'use strict'

// Import the AWS SDK
const AWS = require('aws-sdk')

// Set AWS region based on environment variable
AWS.config.region = process.env.AWS_REGION 

// Initialize S3 and DynamoDB clients
const s3 = new AWS.S3()
const docClient = new AWS.DynamoDB.DocumentClient()

// Generate unique identifiers
const { v4: uuidv4 } = require('uuid')

// Get DynamoDB table name from environment variable
const dynamoDbTableName = process.env.DDBtable

// The Lambda handler
exports.handler = async (event) => {
  // Log the incoming event
  console.log(JSON.stringify(event, null, 2))

  // Log the DynamoDB table name
  console.log('Using DynamoDB table:', dynamoDbTableName)

  // Loop through each record in the incoming S3 event
  await Promise.all(
    event.Records.map(async (record) => {
      try {
        // Log the incoming record
        console.log('Incoming record: ', record)

        // Get the original text from the S3 object in the incoming event
        const originalText = await s3.getObject({
          Bucket: record.s3.bucket.name,
          Key: record.s3.object.key // Set S3FileKey parameter from record
        }).promise()

        // Parse the original text as JSON
        const jsonData = JSON.parse(originalText.Body.toString('utf-8'))

        // Call the ddbLoader function to upload the JSON data to DynamoDB
        await uploadJsonToDynamoDb(jsonData, record.s3.object.key) // Pass S3FileKey parameter to ddbLoader

      } catch (err) {
        // Log any errors
        console.error(err)
      }
    })
  )
}

// Load JSON data to DynamoDB table
const uploadJsonToDynamoDb = async (data, s3FileKey) => {
  // Separate the data into batches for upload
  let batches = []
  const BATCH_SIZE = 30

  while (data.length > 0) {
    batches.push(data.splice(0, BATCH_SIZE))
  }

  // Log the number of batches
  console.log(`Total batches: ${batches.length}`)

  // Initialize the batch counter
  let batchCount = 0

  // Save each batch to DynamoDB
  await Promise.all(
    batches.map(async (item_data) => {

      // Set up the params object for the DynamoDB call
      const params = {
        RequestItems: {}
      }
      params.RequestItems[dynamoDbTableName] = []
  
      // Loop through each item in the batch
      item_data.forEach(item => {
        // Remove any empty string values from the item
        for (let key of Object.keys(item)) {
          if (item[key] === '') 
            delete item[key]
        }

        // Build the params object for the item
        params.RequestItems[dynamoDbTableName].push({
          PutRequest: {
            Item: {
              ID: uuidv4(), // Generate a unique ID for the item
              S3FileKey: s3FileKey, // Add the S3 file path to the item
              ...item // Add all properties from the item to the DynamoDB item
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
        console.error('Error message: ', err)
      }
    })
  )
}