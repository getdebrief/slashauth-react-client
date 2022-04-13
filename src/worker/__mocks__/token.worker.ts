const { messageHandler } = jest.requireActual('../token.worker');

// eslint-disable-next-line import/no-anonymous-default-export
export default class {
  postMessage(data, ports) {
    messageHandler({
      data,
      ports,
    });
  }
}
