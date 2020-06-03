import { CollaborationInspector } from '../../inspectors';
import { createTestContainer, TestContainerContext } from '../../inversify.config';
import { PracticeEvaluationResult } from '../../model';
import { BitbucketService } from '../../services';
import { Types } from '../../types';
import { ThinPullRequestsPractice } from './ThinPullRequestsPractice';
import { getPullRequestsResponse } from '../../services/git/__MOCKS__/bitbucketServiceMockFolder/getPullRequestsResponse';
import moment from 'moment';
import { getPullRequestResponse } from '../../services/git/__MOCKS__/bitbucketServiceMockFolder';

describe('ThinPullRequestsPractice', () => {
  let practice: ThinPullRequestsPractice;
  let containerCtx: TestContainerContext;
  const MockedCollaborationInspector = <jest.Mock<CollaborationInspector>>(<unknown>CollaborationInspector);
  let mockCollaborationInspector: CollaborationInspector;

  beforeAll(() => {
    containerCtx = createTestContainer();
    containerCtx.container.bind('ThinPullRequestsPractice').to(ThinPullRequestsPractice);
    containerCtx.container.rebind(Types.IContentRepositoryBrowser).to(BitbucketService);
    practice = containerCtx.container.get('ThinPullRequestsPractice');
    mockCollaborationInspector = new MockedCollaborationInspector();
  });

  afterEach(async () => {
    containerCtx.virtualFileSystemService.clearFileSystem();
    containerCtx.practiceContext.fileInspector!.purgeCache();
    containerCtx.practiceContext.config = {};
  });

  it('return practicing if there is not a fat PR no older than 30 days than the newest PR', async () => {
    mockCollaborationInspector.listPullRequests = async () => {
      return getPullRequestsResponse();
    };

    const evaluated = await practice.evaluate({
      ...containerCtx.practiceContext,
      collaborationInspector: mockCollaborationInspector,
    });
    expect(evaluated).toEqual(PracticeEvaluationResult.practicing);
  });

  it('return notPracticing if there is a fat PR no older than 7 days than the newest PR (default measurePullRequestsCount)', async () => {
    mockCollaborationInspector.listPullRequests = async () => {
      return getPullRequestsResponse([
        getPullRequestResponse({
          updatedAt: moment().subtract(7, 'd').format('YYYY-MM-DDTHH:mm:ss.SSSSSSZ'),
          lines: {
            additions: 1000,
            deletions: 500,
            changes: 1500,
          },
        }),
      ]);
    };

    const evaluated = await practice.evaluate({
      ...containerCtx.practiceContext,
      collaborationInspector: mockCollaborationInspector,
    });
    expect(evaluated).toEqual(PracticeEvaluationResult.notPracticing);
  });

  it('return practicing if there is a fat PR with higher overriden measurePullRequestsCount', async () => {
    mockCollaborationInspector.listPullRequests = async () => {
      return getPullRequestsResponse([
        getPullRequestResponse({
          updatedAt: moment().subtract(3, 'd').format('YYYY-MM-DDTHH:mm:ss.SSSSSSZ'),
          lines: {
            additions: 1000,
            deletions: 500,
            changes: 1500,
          },
        }),
      ]);
    };

    containerCtx.practiceContext.config = { override: { measurePullRequestCount: 2000 } };

    const evaluated = await practice.evaluate({
      ...containerCtx.practiceContext,
      collaborationInspector: mockCollaborationInspector,
    });
    expect(evaluated).toEqual(PracticeEvaluationResult.practicing);
  });

  it('return notPracticing if there is a small PR with lower overriden measurePullRequestsCount', async () => {
    mockCollaborationInspector.listPullRequests = async () => {
      return getPullRequestsResponse([
        getPullRequestResponse({
          updatedAt: moment().subtract(2, 'd').format('YYYY-MM-DDTHH:mm:ss.SSSSSSZ'),
          lines: {
            additions: 20,
            deletions: 5,
            changes: 25,
          },
        }),
      ]);
    };

    containerCtx.practiceContext.config = { override: { measurePullRequestCount: 10 } };

    const evaluated = await practice.evaluate({
      ...containerCtx.practiceContext,
      collaborationInspector: mockCollaborationInspector,
    });
    expect(evaluated).toEqual(PracticeEvaluationResult.notPracticing);
  });

  it('return unknown if there is no PR', async () => {
    mockCollaborationInspector.listPullRequests = async () => {
      return getPullRequestsResponse([]);
    };

    const evaluated = await practice.evaluate({
      ...containerCtx.practiceContext,
      collaborationInspector: mockCollaborationInspector,
    });
    expect(evaluated).toEqual(PracticeEvaluationResult.unknown);
  });

  it('return true as it is always applicable', async () => {
    const applicable = await practice.isApplicable();
    expect(applicable).toEqual(true);
  });

  it('return unknown if there is no collaborationInspector', async () => {
    containerCtx.practiceContext.collaborationInspector = undefined;

    const evaluated = await practice.evaluate(containerCtx.practiceContext);
    expect(evaluated).toEqual(PracticeEvaluationResult.unknown);
  });
});
