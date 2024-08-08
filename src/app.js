const express = require('express');
const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, CreateBucketCommand, ListBucketsCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

const REGION = process.env.AWS_DEFAULT_REGION || 'us-east-2';

const dynamoDBClient = new DynamoDBClient({
  region: REGION,
  endpoint: process.env.DYNAMODB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
});

const s3Client = new S3Client({
  region: REGION,
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
});

const ddbDocClient = DynamoDBDocumentClient.from(dynamoDBClient);

const tableName = 'ItemsTable';
const bucketName = 'items-bucket';

// Ensure DynamoDB table exists
const ensureTableExists = async () => {
  try {
    const tables = await dynamoDBClient.send(new ListTablesCommand({}));
    if (!tables.TableNames || !tables.TableNames.includes(tableName)) {
      console.log('Creating DynamoDB table...');
      await dynamoDBClient.send(new CreateTableCommand({
        TableName: tableName,
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
      }));
      console.log('DynamoDB table created successfully.');
    } else {
      console.log('DynamoDB table already exists.');
    }
  } catch (error) {
    console.error('Error creating DynamoDB table:', error);
  }
};

// Ensure S3 bucket exists
const ensureBucketExists = async () => {
  try {
    const buckets = await s3Client.send(new ListBucketsCommand({}));
    if (!buckets.Buckets || !buckets.Buckets.some(b => b.Name === bucketName)) {
      console.log('Creating S3 bucket...');
      await s3Client.send(new CreateBucketCommand({
        Bucket: bucketName,
        CreateBucketConfiguration: {
          LocationConstraint: REGION,
        },
      }));
      console.log('S3 bucket created successfully.');
    } else {
      console.log('S3 bucket already exists.');
    }
  } catch (error) {
    console.error('Error creating S3 bucket:', error);
  }
};

const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });

app.get('/items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`Fetching item with ID: ${id} from DynamoDB`);
    const data = await ddbDocClient.send(new GetCommand({
      TableName: tableName,
      Key: { id },
    }));
    console.log('DynamoDB GetItem result:', data);
    
    if (!data.Item) return res.status(404).send({ error: 'Item not found' });

    console.log(`Fetching item with ID: ${id} from S3`);
    const s3Data = await s3Client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: id,
    }));
    const item = JSON.parse(await streamToString(s3Data.Body));
    console.log('S3 GetObject result:', item);

    res.status(200).json({ ...data.Item, ...item });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).send(error);
  }
});

app.post('/items', async (req, res) => {
  const item = req.body;
  try {
    // Check if the item already exists
    const existingItem = await ddbDocClient.send(new GetCommand({
      TableName: tableName,
      Key: { id: item.id },
    }));

    if (existingItem.Item) {
      return res.status(400).send({ error: 'Item already exists' });
    }

    console.log('Storing item in DynamoDB:', item);
    await ddbDocClient.send(new PutCommand({
      TableName: tableName,
      Item: item,
    }));
    console.log('Storing item in S3:', item);
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: item.id,
      Body: JSON.stringify(item),
    }));
    res.status(201).json(item);
  } catch (error) {
    console.error('Error storing item:', error);
    res.status(500).send(error);
  }
});


app.put('/items/:id', async (req, res) => {
  const { id } = req.params;
  const updatedItem = req.body;
  try {
    // Check if the ID is being updated
    if (id !== updatedItem.id) {
      console.log(`Updating item ID from ${id} to ${updatedItem.id} in DynamoDB`);
      
      // Get the current item from DynamoDB
      const currentItemData = await ddbDocClient.send(new GetCommand({
        TableName: tableName,
        Key: { id },
      }));
      
      if (!currentItemData.Item) return res.status(404).send({ error: 'Item not found' });

      // Delete the current item from DynamoDB
      await ddbDocClient.send(new DeleteCommand({
        TableName: tableName,
        Key: { id },
      }));

      // Store the new item with the updated ID in DynamoDB
      await ddbDocClient.send(new PutCommand({
        TableName: tableName,
        Item: updatedItem,
      }));

      // Get the current item from S3
      const s3CurrentData = await s3Client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: id,
      }));
      const currentItem = JSON.parse(await streamToString(s3CurrentData.Body));
      
      // Delete the current item from S3
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: id,
      }));

      // Store the new item with the updated ID in S3
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: updatedItem.id,
        Body: JSON.stringify({ ...currentItem, ...updatedItem }),
      }));

      console.log(`Item ID updated from ${id} to ${updatedItem.id} successfully.`);
      res.status(200).json(updatedItem);
    } else {
      console.log(`Updating item with ID: ${id} in DynamoDB`, updatedItem);
      await ddbDocClient.send(new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: 'set #name = :name, #description = :description',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#description': 'description'
        },
        ExpressionAttributeValues: {
          ':name': updatedItem.name,
          ':description': updatedItem.description,
        },
        ReturnValues: 'UPDATED_NEW',
      }));
      console.log(`Updating item with ID: ${id} in S3`, updatedItem);
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: id,
        Body: JSON.stringify(updatedItem),
      }));
      res.status(200).json(updatedItem);
    }
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).send(error);
  }
});

app.delete('/items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if the item exists
    const existingItem = await ddbDocClient.send(new GetCommand({
      TableName: tableName,
      Key: { id },
    }));

    if (!existingItem.Item) {
      return res.status(404).send({ error: 'Item not found' });
    }

    console.log(`Deleting item with ID: ${id} from DynamoDB`);
    await ddbDocClient.send(new DeleteCommand({
      TableName: tableName,
      Key: { id },
    }));
    console.log(`Deleting item with ID: ${id} from S3`);
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: id,
    }));
    res.status(200).send();
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).send(error);
  }
});


const startServer = async () => {
  await ensureTableExists();
  await ensureBucketExists();
  const server = app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
  return server;
};

module.exports = startServer;
