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
const dynamoDbTableName = process.env.DynamoTable

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


        if (event.eventName === 'FileUploadTXT' && record.s3.object.key.endsWith('.txt')) {
          // Text
          // Log the incoming record
          console.log('FileUploadTXT: ', event.eventName )

          // Get the original text from the S3 object in the incoming event
          const originalText = await s3.getObject({
            Bucket: record.s3.bucket.name,
            Key: record.s3.object.key // Set S3FileKey parameter from record
          }).promise()

          // Call the uploadTextToDynamoDb function to upload the text data to DynamoDB
          await uploadTextToDynamoDb(originalText.Body.toString('utf-8'), record.s3.object.key) // Pass S3FileKey parameter to uploadTextToDynamoDb
        } 
        else {
          console.log('FileUpload JSON: ', event.eventName )
          // JSON
          // Get the original text from the S3 object in the incoming event
          const originalText = await s3.getObject({
            Bucket: record.s3.bucket.name,
            Key: record.s3.object.key // Set S3FileKey parameter from record
          }).promise()

          // Parse the original text as JSON
          const jsonData = JSON.parse(originalText.Body.toString('utf-8'))

          // Call the ddbLoader function to upload the JSON data to DynamoDB
          await uploadJsonToDynamoDb(jsonData, record.s3.object.key) // Pass S3FileKey parameter to ddbLoader

        }

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

// Load text data to DynamoDB table
const uploadTextToDynamoDb = async (data, s3FileKey) => {
  // Split the data into lines
  const lines = data.split(/\r?\n/)

  // Separate the lines into batches for upload
  let batches = []
  const BATCH_SIZE = 30

  while (lines.length > 0) {
    batches.push(lines.splice(0, BATCH_SIZE))
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
      for (let i = 0; i < item_data.length; i++) {
        // Generate a unique identifier for the item
        const id = uuidv4()

        // Set up the DynamoDB item object
        const item = {
          id,
          text: item_data[i],
          s3FileKey
        }

        // Add the item to the batch
        params.RequestItems[dynamoDbTableName].push({
          PutRequest: {
            Item: item
          }
        })
      }

      // Log the number of items in the batch
      console.log(`Batch ${batchCount} contains ${params.RequestItems[dynamoDbTableName].length} items`)

      // Increment the batch counter
      batchCount++

      // Make the DynamoDB call to save the batch
      try {
        await docClient.batchWrite(params).promise()
        console.log(`Batch ${batchCount - 1} saved successfully`)
      } catch (err) {
        console.error(`Error saving batch ${batchCount - 1}: ${err}`)
      }
    })
  )
}


/**
Note:
This is an AWS Lambda function in Node.js that listens to S3 events and uploads the contents of 
uploaded text or JSON files to a DynamoDB table. The function uses the AWS SDK to interact with S3 and DynamoDB.
The function first sets the AWS region and initializes S3 and DynamoDB clients. It then generates a unique identifier 
using the UUID library and retrieves the name of the DynamoDB table from an environment variable.

When a file is uploaded to S3, the function is triggered and a loop is started to process each record in the incoming S3 event. 
The function checks if the uploaded file is a text or JSON file based on the file extension. For text files, the function splits 
the file contents into lines and batches the lines for upload to DynamoDB. For JSON files, the function parses the JSON data and 
batches the items for upload to DynamoDB.

In both cases, the function removes any empty string values from the items and generates a unique identifier for each item.
The function then creates a DynamoDB batch write request with the items and uploads the request to DynamoDB. The batch size is 
limited to 30 items.The function logs the incoming event, the DynamoDB table name, and the progress of the batch writes. 
Any errors that occur during the process are also logged.
 */
