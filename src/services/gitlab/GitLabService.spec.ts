/* eslint-disable @typescript-eslint/camelcase */
import { PullRequestState } from '../../inspectors';
import { argumentsProviderFactory } from '../../test/factories/ArgumentsProviderFactory';
import { gitLabCommitsResponseFactory } from '../../test/factories/responses/gitLab/commitsFactory';
import { gitLabIssueResponseFactory, issueOfUser } from '../../test/factories/responses/gitLab/issueResponseFactory';
import { gitLabPullRequestResponseFactory } from '../../test/factories/responses/gitLab/prResponseFactory';
import { gitLabRepoCommitsResponseFactory } from '../../test/factories/responses/gitLab/repoCommitResponseFactory';
import { GitLabNock } from '../../test/helpers/gitLabNock';
import { getIssueResponse } from '../git/__MOCKS__/gitLabServiceMockFolder/getIssueResponse';
import { getPullCommitsResponse } from '../git/__MOCKS__/gitLabServiceMockFolder/getPullCommitsResponse';
import { getPullRequestResponse } from '../git/__MOCKS__/gitLabServiceMockFolder/getPullRequestResponse';
import { getRepoCommit } from '../git/__MOCKS__/gitLabServiceMockFolder/getRepoCommitResponse';
import { listIssueCommentsResponse } from '../git/__MOCKS__/gitLabServiceMockFolder/listIssueComments';
import { listIssuesResponse, mockListIssuesResponseForUser } from '../git/__MOCKS__/gitLabServiceMockFolder/listIssuesResponse';
import { listPullRequestsResponse } from '../git/__MOCKS__/gitLabServiceMockFolder/listPullRequestsResponse';
import { listRepoCommits } from '../git/__MOCKS__/gitLabServiceMockFolder/listRepoCommitsResponse';
import { GitLabService } from './GitLabService';
import { GitLabPullRequestState } from './IGitLabService';

describe('GitLab Service', () => {
  let service: GitLabService;
  let gitLabNock: GitLabNock;

  const repositoryConfig = {
    remoteUrl: 'https://gitlab.com/gitlab/gitlab-org',
    baseUrl: 'https://gitlab.com',
    host: 'gitlab.com',
    protocol: 'https',
  };

  beforeEach(async () => {
    service = new GitLabService(argumentsProviderFactory({ uri: 'https://gitlab.com/gitlab-org/gitlab' }), repositoryConfig);
    gitLabNock = new GitLabNock('gitlab-org', 'gitlab');
  });

  it('Returns list of merge requests in own interface', async () => {
    const mockPr = gitLabPullRequestResponseFactory();

    gitLabNock.getGroupInfo();
    gitLabNock.listPullRequestsResponse([mockPr], { filter: { state: GitLabPullRequestState.open }, pagination: { page: 1, perPage: 1 } });

    const response = await service.listPullRequests('gitlab-org', 'gitlab', {
      pagination: { page: 1, perPage: 1 },
      filter: { state: PullRequestState.open },
    });

    expect(response).toMatchObject(listPullRequestsResponse(undefined, { page: 1, perPage: 1 }));
  });

  it('Returns one pull request in own interface', async () => {
    const mockPr = gitLabPullRequestResponseFactory();

    gitLabNock.getPullRequestResponse(mockPr, 25985);
    gitLabNock.getGroupInfo();

    const response = await service.getPullRequest('gitlab-org', 'gitlab', 25985);
    expect(response).toMatchObject(getPullRequestResponse());
  });

  it('Returns pull commits in own interface', async () => {
    const mockCommits = gitLabCommitsResponseFactory();

    gitLabNock.listPullCommitsResponse([mockCommits], 25985, { pagination: { page: 1, perPage: 1 } });
    gitLabNock.getCommitResponse(mockCommits, '4eecfba1b1e2c35c13a7b34fc3d71e58cbb3645d');

    const response = await service.listPullCommits('gitlab-org', 'gitlab', 25985, { pagination: { page: 1, perPage: 1 } });
    expect(response).toMatchObject(getPullCommitsResponse(undefined, { page: 1, perPage: 1 }));
  });

  it('Returns repo commit in own interface', async () => {
    const mockCommits = gitLabCommitsResponseFactory();

    gitLabNock.getCommitResponse(mockCommits, 'df760e1c');

    const response = await service.getCommit('gitlab-org', 'gitlab', 'df760e1c');
    expect(response).toMatchObject(getRepoCommit());
  });

  it('Returns repo commits in own interface', async () => {
    const mockCommits = gitLabRepoCommitsResponseFactory();

    gitLabNock.listRepoCommitsResponse([mockCommits], { pagination: { page: 1, perPage: 1 } });

    const response = await service.listRepoCommits('gitlab-org', 'gitlab', { pagination: { page: 1, perPage: 1 } });
    expect(response).toMatchObject(listRepoCommits(undefined, { page: 1, perPage: 1 }));
  });

  it('Returns one issue in own interface', async () => {
    const mockIssue = gitLabIssueResponseFactory({});
    gitLabNock.getIssueResponse(mockIssue);

    const response = await service.getIssue('gitlab-org', 'gitlab', 207825);
    expect(response).toMatchObject(getIssueResponse());
  });

  it('Returns issues in own interface', async () => {
    const mockIssue = gitLabIssueResponseFactory({});

    gitLabNock.listIssuesResponse([mockIssue], { pagination: { page: 1, perPage: 1 } });
    gitLabNock.getGroupInfo();

    const response = await service.listIssues('gitlab-org', 'gitlab', { pagination: { page: 1, perPage: 1 } });
    expect(response).toMatchObject(listIssuesResponse(undefined, { page: 1, perPage: 1 }));
  });

  it('Returns issues for user in own interface', async () => {
    gitLabNock = new GitLabNock('homolova', 'ted_ontouml_kom');

    const mockIssue = gitLabIssueResponseFactory(issueOfUser);

    gitLabNock.listIssuesResponse([mockIssue], { pagination: { page: 1, perPage: 1 } });
    gitLabNock.getUserInfo();

    const response = await service.listIssues('homolova', 'ted_ontouml_kom', { pagination: { page: 1, perPage: 1 } });
    expect(response).toMatchObject(listIssuesResponse(mockListIssuesResponseForUser, { page: 1, perPage: 1 }));
  });

  it('Returns issue comments in own interface', async () => {
    gitLabNock = new GitLabNock('homolova', 'ted_ontouml_kom');
    gitLabNock.listIssueCommentsResponse(1, { pagination: { page: 1, perPage: 1 } });

    const response = await service.listIssueComments('homolova', 'ted_ontouml_kom', 1, { pagination: { page: 1, perPage: 1 } });
    expect(response).toMatchObject(listIssueCommentsResponse(undefined, { page: 1, perPage: 1 }));
  });

  it('The response id defined when getRepo is called', async () => {
    gitLabNock.getRepoResponse();

    const response = await service.getRepo('gitlab-org', 'gitlab');
    expect(response).toBeDefined();
  });

  //TODO test for checkVersion()
  // it.only('', async () => {
  //   const response = await service.checkVersion();
  //   console.log(response);
  // });
});
