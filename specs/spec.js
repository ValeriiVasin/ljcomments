/*global browser,element,by*/

function CommentsPage() {
  browser.ignoreSynchronization = true;
  browser.get('http://localhost:8000/');

  var el = this.elements = {
    pager: $('.b-pager'),
    pages: $('.b-pager').all( by.css('.b-pager-page') ),
    activePage: $('.b-pager').$('.b-pager-page-active'),
    pagerNext: $('.b-pager').$('.b-pager-next'),
    pagerPrev: $('.b-pager').$('.b-pager-prev')
  };

  this.switchToPage = function (page) {
    el.pages.get(page - 1).click();
  };

  this.isActivePage = function (page) {
    return el.activePage.getText().then(function (value) {
      return value === String(page);
    });
  };
}

// spec.js
describe('Comments', function() {
  var Page = new CommentsPage();

  it('should have a title', function () {
    expect( browser.getTitle() ).toEqual('First Component');
  });

  it('should switch pages correctly', function () {
    Page.switchToPage(2);
    expect(
      Page.isActivePage(2)
    ).toBeTruthy();

    Page.switchToPage(3);
    expect(
      Page.isActivePage(3)
    ).toBe(true);
  });
});
