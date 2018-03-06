import { ArousaNorteBackendPage } from './app.po';

describe('arousa-norte-backend App', () => {
  let page: ArousaNorteBackendPage;

  beforeEach(() => {
    page = new ArousaNorteBackendPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
