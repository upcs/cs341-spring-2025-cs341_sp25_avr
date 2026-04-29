/**
 * @jest-environment node
 */

const { invokeRoute } = require('./serverHelpers');

function buildContentRouter() {
  jest.resetModules();

  const dbMock = {
    dbquery: jest.fn(),
  };

  const authMock = {
    requireAuth: jest.fn((req, _res, next) => next()),
    requireAdmin: jest.fn((req, _res, next) => next()),
  };

  const submissionsMock = {
    createSubmission: jest.fn(),
    getSubmissionById: jest.fn(),
    readSubmissions: jest.fn(() => []),
    updateSubmission: jest.fn(),
  };

  jest.doMock('../routes/dbms_promise', () => dbMock);
  jest.doMock('../auth', () => authMock);
  jest.doMock('../photoSubmissions', () => submissionsMock);
  const multerMock = jest.fn(() => ({
    single: jest.fn(() => (req, _res, next) => {
      if (req.body && req.body.__uploadError) {
        next(req.body.__uploadError);
        return;
      }
      req.file = req.body && req.body.__file ? req.body.__file : undefined;
      next();
    }),
  }));
  multerMock.diskStorage = jest.fn((config) => config);
  jest.doMock('multer', () => multerMock);

  const router = require('../routes/contentTable');
  return { router, dbMock, authMock, multerMock, submissionsMock };
}

describe('initialApp content routes', () => {
  test('serves sample content and building timelines with normalized image paths', async () => {
    const { router, dbMock } = buildContentRouter();

    dbMock.dbquery
      .mockResolvedValueOnce([{ buildingName: 'Shiley', year: 2000, description: 'Sample row' }])
      .mockResolvedValueOnce([
        {
          buildingName: 'Shiley',
          year: 2001,
          description: 'History row',
          imagePath: 'initialApp\\public\\archiveContent\\shiley\\1948.jpg',
        },
      ]);

    const sampleResponse = await invokeRoute(router, 'get', '/sample', {
      query: { limit: '99' },
    });
    expect(sampleResponse.status).toBe(200);
    expect(sampleResponse.json).toEqual([{ buildingName: 'Shiley', year: 2000, description: 'Sample row' }]);
    expect(dbMock.dbquery.mock.calls[0][0]).toContain('LIMIT 10');

    expect(await invokeRoute(router, 'get', '/by-building')).toMatchObject({
      status: 400,
      json: { message: 'buildingName or buildingId is required' },
    });

    const byBuildingResponse = await invokeRoute(router, 'get', '/by-building', {
      query: { buildingName: 'Shiley', buildingId: 'shiley' },
    });
    expect(byBuildingResponse.status).toBe(200);
    expect(byBuildingResponse.json).toEqual([
      {
        buildingName: 'Shiley',
        year: 2001,
        description: 'History row',
        imagePath: '/archiveContent/shiley/1948.jpg',
      },
    ]);
    expect(dbMock.dbquery.mock.calls[1][0]).toContain("buildingName IN ('Shiley', 'shiley')");
  });

  test('creates, updates, and deletes timeline entries with validation and failure handling', async () => {
    const { router, dbMock, authMock } = buildContentRouter();

    dbMock.dbquery
      .mockRejectedValueOnce(new Error('sample fail'))
      .mockRejectedValueOnce(new Error('timeline fail'))
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('update fail'))
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('delete fail'));

    expect(await invokeRoute(router, 'get', '/sample')).toMatchObject({
      status: 500,
      json: { message: 'Failed to load sample content' },
    });

    expect(
      await invokeRoute(router, 'get', '/by-building', {
        query: { buildingName: 'Shiley' },
      })
    ).toMatchObject({
      status: 500,
      json: { message: 'Failed to load building timeline' },
    });

    expect(
      await invokeRoute(router, 'post', '/timeline', {
        body: { buildingName: '', year: 2000, description: '' },
      })
    ).toMatchObject({
      status: 400,
      json: { message: 'buildingName, year, and description are required' },
    });

    expect(
      await invokeRoute(router, 'post', '/timeline', {
        body: { buildingName: 'Shiley', year: 'nope', description: 'Desc' },
      })
    ).toMatchObject({
      status: 400,
      json: { message: 'year must be a valid number' },
    });

    const createTimeline = await invokeRoute(router, 'post', '/timeline', {
      body: { buildingName: 'Shiley', year: 2000, description: 'Desc', imagePath: 'public\\img.jpg' },
    });
    expect(createTimeline).toMatchObject({
      status: 200,
      json: { ok: true },
    });
    expect(dbMock.dbquery.mock.calls[2][0]).toContain("INSERT INTO Content");
    expect(authMock.requireAuth).toHaveBeenCalled();

    expect(
      await invokeRoute(router, 'put', '/timeline', {
        body: {},
      })
    ).toMatchObject({
      status: 400,
      json: { message: 'buildingName and year are required' },
    });

    expect(
      await invokeRoute(router, 'put', '/timeline', {
        body: { buildingName: 'Shiley', year: 'bad' },
      })
    ).toMatchObject({
      status: 400,
      json: { message: 'year must be a valid number' },
    });

    expect(
      await invokeRoute(router, 'put', '/timeline', {
        body: { buildingName: 'Shiley', year: 2000, newYear: 'bad' },
      })
    ).toMatchObject({
      status: 400,
      json: { message: 'newYear must be a valid number' },
    });

    expect(
      await invokeRoute(router, 'put', '/timeline', {
        body: { buildingName: 'Shiley', year: 2000 },
      })
    ).toMatchObject({
      status: 400,
      json: { message: 'No fields provided to update' },
    });

    expect(
      await invokeRoute(router, 'put', '/timeline', {
        body: { buildingName: 'Shiley', year: 2000, description: 'Updated', imagePath: '', newYear: 2001 },
      })
    ).toMatchObject({
      status: 500,
      json: { message: 'Failed to update timeline entry' },
    });

    expect(
      await invokeRoute(router, 'put', '/timeline', {
        body: { buildingName: 'Shiley', year: 2000, description: 'Updated', imagePath: 'path/to/img.jpg', newYear: 2001 },
      })
    ).toMatchObject({
      status: 200,
      json: { ok: true },
    });

    expect(
      await invokeRoute(router, 'delete', '/timeline', {
        body: {},
      })
    ).toMatchObject({
      status: 400,
      json: { message: 'buildingName and year are required' },
    });

    expect(
      await invokeRoute(router, 'delete', '/timeline', {
        body: { buildingName: 'Shiley', year: 'bad' },
      })
    ).toMatchObject({
      status: 400,
      json: { message: 'year must be a valid number' },
    });

    expect(
      await invokeRoute(router, 'delete', '/timeline', {
        body: { buildingName: 'Shiley', year: 2000 },
      })
    ).toMatchObject({
      status: 500,
      json: { message: 'Failed to delete timeline entry' },
    });
  });

  test('serves, mutates, and uploads photo records', async () => {
    const { router, dbMock, authMock, submissionsMock } = buildContentRouter();

    dbMock.dbquery
      .mockResolvedValueOnce([
        {
          id: 1,
          buildingName: 'Shiley',
          year: 2001,
          imageUrl: 'initialApp\\public\\images\\wally.png',
          caption: 'Uploaded photo',
        },
        {
          id: 2,
          buildingName: 'Shiley',
          year: 2002,
          imageUrl: 'initialApp\\public\\uploads\\missing.jpg',
          caption: 'Missing upload',
        },
        {
          id: 3,
          buildingName: 'Shiley',
          year: 2003,
          imageUrl: 'initialApp\\public\\uploads\\not-a-photo.docx',
          caption: 'Non-image upload',
        },
      ])
      .mockRejectedValueOnce(new Error('photos fail'))
      .mockResolvedValueOnce([{ buildingName: 'Shiley', count: 2 }])
      .mockRejectedValueOnce(new Error('stats fail'))
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('add photo fail'))
      .mockRejectedValueOnce(new Error('update photo fail'))
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('delete photo fail'))
      .mockResolvedValueOnce([]);

    const photosResponse = await invokeRoute(router, 'get', '/photos', {
      query: { buildingName: 'Shiley', limit: '9999' },
    });
    expect(photosResponse.status).toBe(200);
    expect(photosResponse.json).toEqual([
      {
        id: 1,
        buildingName: 'Shiley',
        year: 2001,
        caption: 'Uploaded photo',
        imageUrl: '/images/wally.png',
      },
      {
        id: 2,
        buildingName: 'Shiley',
        year: 2002,
        caption: 'Missing upload',
        imageUrl: '/placeholder.svg',
      },
      {
        id: 3,
        buildingName: 'Shiley',
        year: 2003,
        caption: 'Non-image upload',
        imageUrl: '/placeholder.svg',
      },
    ]);
    expect(dbMock.dbquery.mock.calls[0][0]).toContain('LIMIT 5000');

    expect(await invokeRoute(router, 'get', '/photos')).toMatchObject({
      status: 500,
      json: { message: 'Failed to load photos' },
    });

    expect(await invokeRoute(router, 'get', '/photos/stats')).toMatchObject({
      status: 200,
      json: [{ buildingName: 'Shiley', count: 2 }],
    });

    expect(await invokeRoute(router, 'get', '/photos/stats')).toMatchObject({
      status: 500,
      json: { message: 'Failed to load photo stats' },
    });

    expect(
      await invokeRoute(router, 'post', '/photos', {
        body: { buildingName: '', imageUrl: '' },
      })
    ).toMatchObject({
      status: 400,
      json: { message: 'buildingName and imageUrl are required' },
    });

    expect(
      await invokeRoute(router, 'post', '/photos', {
        body: { buildingName: 'Shiley', year: 2002, imageUrl: 'public\\uploaded.jpg', caption: 'New photo' },
      })
    ).toMatchObject({
      status: 200,
      json: { ok: true },
    });
    expect(authMock.requireAdmin).toHaveBeenCalled();

    expect(
      await invokeRoute(router, 'post', '/photos', {
        body: { buildingName: 'Shiley', imageUrl: '/img.jpg' },
      })
    ).toMatchObject({
      status: 500,
      json: { message: 'Failed to add photo' },
    });

    expect(
      await invokeRoute(router, 'put', '/photos/:id', {
        params: { id: 'not-a-number' },
        body: { caption: 'Bad' },
      })
    ).toMatchObject({
      status: 400,
      json: { message: 'Invalid photo id' },
    });

    expect(
      await invokeRoute(router, 'put', '/photos/:id', {
        params: { id: '1' },
        body: { year: 'bad' },
      })
    ).toMatchObject({
      status: 400,
      json: { message: 'year must be a valid number' },
    });

    expect(
      await invokeRoute(router, 'put', '/photos/:id', {
        params: { id: '1' },
        body: {},
      })
    ).toMatchObject({
      status: 400,
      json: { message: 'No fields provided to update' },
    });

    expect(
      await invokeRoute(router, 'put', '/photos/:id', {
        params: { id: '1' },
        body: { year: 2003, caption: 'Updated', imageUrl: 'public\\new.jpg' },
      })
    ).toMatchObject({
      status: 500,
      json: { message: 'Failed to update photo' },
    });

    expect(
      await invokeRoute(router, 'put', '/photos/:id', {
        params: { id: '1' },
        body: { year: 2004, caption: 'Updated', imageUrl: '/updated.jpg' },
      })
    ).toMatchObject({
      status: 200,
      json: { ok: true },
    });

    expect(
      await invokeRoute(router, 'delete', '/photos/:id', {
        params: { id: 'not-a-number' },
      })
    ).toMatchObject({
      status: 400,
      json: { message: 'Invalid photo id' },
    });

    expect(
      await invokeRoute(router, 'delete', '/photos/:id', {
        params: { id: '2' },
      })
    ).toMatchObject({
      status: 500,
      json: { message: 'Failed to delete photo' },
    });

    expect(
      await invokeRoute(router, 'delete', '/photos/:id', {
        params: { id: '2' },
      })
    ).toMatchObject({
      status: 200,
      json: { ok: true },
    });

    expect(
      await invokeRoute(router, 'post', '/photos/upload', {
        body: {},
      })
    ).toMatchObject({
      status: 400,
      json: { message: 'buildingName and photo file are required' },
    });

    const fileSizeError = new Error('File too large');
    fileSizeError.code = 'LIMIT_FILE_SIZE';
    expect(
      await invokeRoute(router, 'post', '/photos/upload', {
        body: { __uploadError: fileSizeError },
      })
    ).toMatchObject({
      status: 413,
      json: { message: 'File too large' },
    });

    submissionsMock.createSubmission.mockReturnValueOnce({
      id: 'submission-1',
      buildingName: 'Shiley',
      year: 2005,
      imageUrl: '/uploads/test-photo.png',
      caption: 'Upload caption',
      status: 'pending',
      submittedAt: '2026-04-16T12:00:00.000Z',
      submittedByName: 'Campus User',
    });

    const uploadResponse = await invokeRoute(router, 'post', '/photos/upload', {
      body: {
        buildingName: 'Shiley',
        year: '2005',
        caption: 'Upload caption',
        __file: { filename: 'test-photo.png' },
      },
    });
    expect(uploadResponse.status).toBe(201);
    expect(uploadResponse.json).toEqual({
      ok: true,
      message: 'Photo submitted for admin approval',
      submission: {
        id: 'submission-1',
        buildingName: 'Shiley',
        year: 2005,
        imageUrl: '/uploads/test-photo.png',
        caption: 'Upload caption',
        status: 'pending',
        submittedAt: '2026-04-16T12:00:00.000Z',
        submittedByName: 'Campus User',
      },
    });

    expect(authMock.requireAuth).toHaveBeenCalled();
  });

  test('configures photo upload size and image-type protections', () => {
    const { multerMock } = buildContentRouter();
    const uploadOptions = multerMock.mock.calls[0][0];
    const accept = jest.fn();
    const reject = jest.fn();

    expect(uploadOptions.limits.fileSize).toBe(5 * 1024 * 1024);

    uploadOptions.fileFilter({}, { mimetype: 'image/png' }, accept);
    uploadOptions.fileFilter({}, { mimetype: 'image/avif' }, accept);
    uploadOptions.fileFilter({}, { mimetype: 'application/octet-stream', originalname: 'campus.heic' }, accept);
    expect(accept).toHaveBeenCalledWith(null, true);

    uploadOptions.fileFilter({}, { mimetype: 'text/plain' }, reject);
    expect(reject.mock.calls[0][0]).toEqual(expect.any(Error));
    expect(reject.mock.calls[0][0].message).toMatch(/Only image files/i);
  });

  test('lists and moderates pending photo submissions', async () => {
    const { router, dbMock, submissionsMock, authMock } = buildContentRouter();

    submissionsMock.readSubmissions.mockReturnValueOnce([
      {
        id: 'submission-1',
        buildingName: 'Shiley',
        year: 2005,
        imageUrl: 'initialApp\\public\\images\\wally.png',
        caption: 'Upload caption',
        status: 'pending',
        submittedAt: '2026-04-16T12:00:00.000Z',
        submittedByName: 'Campus User',
      },
      {
        id: 'submission-missing',
        buildingName: 'Franz Hall',
        year: 2006,
        imageUrl: 'initialApp\\public\\uploads\\missing-photo.png',
        caption: 'Missing upload',
        status: 'pending',
        submittedAt: '2026-04-15T12:00:00.000Z',
        submittedByName: 'Campus User',
      },
    ]);
    submissionsMock.getSubmissionById
      .mockReturnValueOnce({
        id: 'submission-1',
        buildingName: 'Shiley',
        year: 2005,
        imageUrl: '/uploads/test-photo.png',
        caption: 'Upload caption',
        status: 'pending',
      })
      .mockReturnValueOnce({
        id: 'submission-2',
        buildingName: 'Franz Hall',
        year: 2006,
        imageUrl: '/uploads/reject-photo.png',
        caption: 'Reject me',
        status: 'pending',
      });
    submissionsMock.updateSubmission
      .mockReturnValueOnce({
        id: 'submission-1',
        status: 'approved',
      })
      .mockReturnValueOnce({
        id: 'submission-2',
        status: 'rejected',
      });
    dbMock.dbquery.mockResolvedValueOnce([]);

    expect(await invokeRoute(router, 'get', '/photos/submissions', {
      query: { status: 'pending' },
    })).toMatchObject({
      status: 200,
      json: [
        expect.objectContaining({
          id: 'submission-1',
          status: 'pending',
          imageUrl: '/images/wally.png',
        }),
        expect.objectContaining({
          id: 'submission-missing',
          status: 'pending',
          imageUrl: '/placeholder.svg',
        }),
      ],
    });

    expect(await invokeRoute(router, 'post', '/photos/submissions/:id/approve', {
      params: { id: 'submission-1' },
      body: {},
      cookies: {},
    })).toMatchObject({
      status: 200,
      json: {
        ok: true,
        submission: {
          id: 'submission-1',
          status: 'approved',
        },
      },
    });
    expect(authMock.requireAdmin).toHaveBeenCalled();

    expect(await invokeRoute(router, 'post', '/photos/submissions/:id/reject', {
      params: { id: 'submission-2' },
      body: {},
      cookies: {},
    })).toMatchObject({
      status: 200,
      json: {
        ok: true,
        submission: {
          id: 'submission-2',
          status: 'rejected',
        },
      },
    });
  });
});
