function findRoute(router, method, path) {
  const lowerMethod = method.toLowerCase();
  const layer = router.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[lowerMethod]
  );

  if (!layer) {
    throw new Error(`Route not found for ${method.toUpperCase()} ${path}`);
  }

  return layer.route.stack.map((entry) => entry.handle);
}

function createResponse(resolve) {
  return {
    body: '',
    finished: false,
    headers: {},
    jsonBody: null,
    locals: {},
    statusCode: 200,
    viewName: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    set(name, value) {
      this.headers[String(name).toLowerCase()] = value;
      return this;
    },
    type(value) {
      this.headers['content-type'] = value;
      return this;
    },
    cookie(name, value) {
      if (!this.headers['set-cookie']) {
        this.headers['set-cookie'] = [];
      }
      this.headers['set-cookie'].push(`${name}=${value}`);
      return this;
    },
    clearCookie(name) {
      if (!this.headers['set-cookie']) {
        this.headers['set-cookie'] = [];
      }
      this.headers['set-cookie'].push(`${name}=`);
      return this;
    },
    json(payload) {
      this.finished = true;
      this.jsonBody = payload;
      this.body = JSON.stringify(payload);
      resolve(this);
      return this;
    },
    send(payload) {
      this.finished = true;
      this.body = payload;
      resolve(this);
      return this;
    },
    end(payload = '') {
      this.finished = true;
      this.body = payload;
      resolve(this);
      return this;
    },
    redirect(statusOrUrl, maybeUrl) {
      this.finished = true;
      if (typeof maybeUrl === 'undefined') {
        this.statusCode = 302;
        this.headers.location = statusOrUrl;
      } else {
        this.statusCode = statusOrUrl;
        this.headers.location = maybeUrl;
      }
      resolve(this);
      return this;
    },
    render(viewName, locals) {
      this.finished = true;
      this.viewName = viewName;
      this.locals = locals;
      this.body = JSON.stringify({ viewName, locals });
      resolve(this);
      return this;
    },
  };
}

async function invokeRoute(router, method, path, options = {}) {
  const handlers = findRoute(router, method, path);

  return new Promise((resolve, reject) => {
    let settled = false;
    let index = 0;

    const finalize = (res) => {
      if (!settled) {
        settled = true;
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: res.body,
          json: res.jsonBody,
          locals: res.locals,
          viewName: res.viewName,
        });
      }
    };

    const req = {
      body: options.body || {},
      cookies: options.cookies || {},
      file: options.file,
      headers: options.headers || {},
      method: method.toUpperCase(),
      params: options.params || {},
      path,
      protocol: options.protocol || 'http',
      query: options.query || {},
      get(name) {
        const key = String(name).toLowerCase();
        return this.headers[key] || this.headers[name] || null;
      },
    };

    const res = createResponse(finalize);

    const run = () => {
      const handler = handlers[index];
      index += 1;

      if (!handler) {
        finalize(res);
        return;
      }

      try {
        const maybePromise = handler(req, res, (error) => {
          if (error) {
            reject(error);
            return;
          }
          run();
        });

        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise.then(() => {
            if (!res.finished && index >= handlers.length) {
              finalize(res);
            }
          }).catch(reject);
        }
      } catch (error) {
        reject(error);
      }
    };

    run();
  });
}

module.exports = {
  invokeRoute,
};
