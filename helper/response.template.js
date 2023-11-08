function ResponseTemplate(data, message, error, status, metadata) {
  const response = {
    data,
    message,
    error,
  };

  if (metadata) {
    response.metadata = metadata;
  }

  return {
    status: status || 200,
    response,
  };
}
