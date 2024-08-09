const request = require('supertest');
let server;

beforeAll(async () => {
  const startServer = require('../src/app');
  server = await startServer();
});

afterAll((done) => {
  server.close(done);
});


describe('Items API', () => {
  const testItem = {
    id: '1',
    name: 'Test Item',
    description: 'A test item',
  };

  it('Sending a GET request that finds no results returns the appropriate response', async () => {
    const res = await request(server).get(`/items/${testItem.id}`);
    
    expect(res.status).toBe(404);
  });

  it('Sending a GET request with no parameters returns the appropriate response', async () => {
    const res = await request(server).get('/items/');
    
    expect(res.status).toBe(404);
  });

  it('Sending a GET request with incorrect parameters returns the appropriate response', async () => {
    const res = await request(server).get(`/getItems/${testItem.id}`);
    
    expect(res.status).toBe(404);
  });

  // POST tests
  it('Sending a POST request results in the JSON body being stored as an item in the database, and an object in an S3 bucket', async () => {
    const res = await request(server).post('/items').send(testItem);
    
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(testItem);

    // Verify the item is in the database and S3
    const getRes = await request(server).get(`/items/${testItem.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toMatchObject(testItem);
  });


  it('Sending a GET request with appropriate parameters returns expected JSON from the database', async () => {
    const res = await request(server).get(`/items/${testItem.id}`);
    
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(testItem);
  });

  it('Sending a duplicate POST request returns the appropriate response', async () => {
    await request(server).post('/items').send(testItem);
    const res = await request(server).post('/items').send(testItem);
    
    expect(res.status).toBe(400);
  });

  // PUT tests
  it('Sending a PUT request that targets an existing resource results in updates to the appropriate item in the database and object in the S3 bucket', async () => {
    const updatedItem = { ...testItem, name: 'Updated Test Item' };
    const res = await request(server).put(`/items/${testItem.id}`).send(updatedItem);
    
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(updatedItem);

    // Verify the updated item is in the database and S3
    const getRes = await request(server).get(`/items/${testItem.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toMatchObject(updatedItem);
  });

  it('Sending a PUT request with no valid target returns the appropriate response', async () => {
    const res = await request(server).put('/items/non-existing-id').send(testItem);
    
    expect(res.status).toBe(404);
  });


  // DELETE tests
  it('Sending a DELETE request results in the appropriate item being removed from the database and object being removed from the S3 bucket', async () => {
    const res = await request(server).delete(`/items/${testItem.id}`);
    
    expect(res.status).toBe(200);

    // Verify the item is deleted from the database and S3
    const getRes = await request(server).get(`/items/${testItem.id}`);
    expect(getRes.status).toBe(404);
  });

  it('Sending a DELETE request with no valid target returns the appropriate response', async () => {
    const res = await request(server).delete('/items/non-existing-id');
    
    expect(res.status).toBe(404);
  });
});