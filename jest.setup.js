import '@testing-library/jest-dom';

// Mock mongoose to prevent actual DB connections during unit tests
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn(),
    connection: {
      on: jest.fn(),
      readyState: 1,
    },
  };
});
