// export const path = 'http://localhost:3001/v0';
export const path = 'https://cse115a-project.onrender.com/v0';

export const waitTime = 1300;

export const callBackend = async (
  method: string,
  pathExtension: string,
  accessToken = '',
  requestBody = {},
  contentType = 'application/json'
) => {
  const headerObject = {
    'Content-Type': `${contentType}`,
    Authorization: accessToken ? `Bearer ${accessToken}` : null,
  };
  const fetchObject = {
    method: `${method}`,
    headers: new Headers(headerObject),
  };
  if (JSON.stringify(requestBody) != '{}') {
    fetchObject['body'] =
      contentType == 'application/json'
        ? JSON.stringify(requestBody)
        : requestBody;
  }

  return fetch(`${path}/${pathExtension}`, fetchObject);
};
