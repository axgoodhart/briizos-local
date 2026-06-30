let localDataService = null;

function setLocalDataService(service) {
  localDataService = service;
}

function getReceipt(opId) {
  if (!opId || !localDataService) return null;
  return localDataService.getOperationReceipt(opId);
}

function recordReceipt(opId, result) {
  if (!opId || !localDataService) return;
  localDataService.recordOperationReceipt(opId, { result, status: result?.success === false ? 'failed' : 'completed' });
}

module.exports = {
  getReceipt,
  recordReceipt,
  setLocalDataService,
};
