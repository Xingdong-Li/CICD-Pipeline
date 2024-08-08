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

  it('should store JSON in the database and S3 bucket on POST request', async () => {
    // Act
    const res = await request(server).post('/items').send(testItem);

    // Assert
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(testItem);

    // Verify the item is in the database and S3
    const getRes = await request(server).get(`/items/${testItem.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toMatchObject(testItem);
  });

  it('should return expected JSON from the database and S3 bucket on GET request', async () => {
    // Act
    const res = await request(server).get(`/items/${testItem.id}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(testItem);
  });

  it('should return 404 for a GET request with a non-existing ID', async () => {
    // Act
    const res = await request(server).get('/items/non-existing-id');

    // Assert
    expect(res.status).toBe(404);
  });

  it('should update the item in the database and S3 bucket on PUT request', async () => {
    const updatedItem = { ...testItem, name: 'Updated Test Item' };

    // Act
    const res = await request(server).put(`/items/${testItem.id}`).send(updatedItem);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(updatedItem);

    // Verify the updated item is in the database and S3
    const getRes = await request(server).get(`/items/${testItem.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toMatchObject(updatedItem);
  });

  it('should return 400 for duplicate POST request', async () => {
    // Arrange
    await request(server).post('/items').send(testItem);

    // Act
    const res = await request(server).post('/items').send(testItem);

    // Assert
    expect(res.status).toBe(400);
  });

  it('should delete the item from the database and S3 bucket on DELETE request', async () => {
    // Act
    const res = await request(server).delete(`/items/${testItem.id}`);

    // Assert
    expect(res.status).toBe(200);

    // Verify the item is deleted from the database and S3
    const getRes = await request(server).get(`/items/${testItem.id}`);
    expect(getRes.status).toBe(404);
  });

  it('should return 404 for PUT request with no valid target', async () => {
    // Act
    const res = await request(server).put('/items/non-existing-id').send(testItem);

    // Assert
    expect(res.status).toBe(404);
  });

  it('should return 404 for DELETE request with no valid target', async () => {
    // Act
    const res = await request(server).delete('/items/non-existing-id');

    // Assert
    expect(res.status).toBe(404);
  });
});
