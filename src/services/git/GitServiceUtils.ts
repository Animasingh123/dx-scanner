import gitUrlParse from 'git-url-parse';
import { GitService } from './model';
import { assertNever } from '../../lib/assertNever';

export class GitServiceUtils {
  static getUrlToRepo = (url: string, path?: string | undefined, branch = 'master') => {
    const parsedUrl = gitUrlParse(url);

    let completeUrl = `${parsedUrl.protocol}://${parsedUrl.resource}/${parsedUrl.owner}/${parsedUrl.name}`;
    const sourceUrl = <GitService | null>parsedUrl.resource;

    if (path && sourceUrl) {
      completeUrl += GitServiceUtils.getPath(sourceUrl, path, branch || parsedUrl.ref);
    }

    return completeUrl;
  };

  static parseUrl = (url: string): ParsedUrl => {
    const parsedUrl = gitUrlParse(url);

    return {
      owner: parsedUrl.owner,
      repoName: parsedUrl.name,
      host: parsedUrl.resource,
      protocol: parsedUrl.protocol,
    };
  };

  static getPath = (service: GitService, path: string, branch = 'master') => {
    switch (service) {
      case GitService.github:
        return `/tree/${branch}${path}`;
      case GitService.bitbucket:
        return `/src/${branch}${path}`;
      case GitService.gitlab:
        return `/tree/${branch}${path}`;

      default:
        return assertNever(service);
    }
  };

  static getRepoName = (repositoryPath: string | undefined, path: string): string => {
    if (repositoryPath) {
      return GitServiceUtils.getPathOrRepoUrl(repositoryPath);
    } else {
      return path;
    }
  };

  static getPathOrRepoUrl = (url: string, path?: string | undefined, branch = 'master') => {
    const parsedUrl = gitUrlParse(url);

    if (parsedUrl.protocol === 'file') {
      return url;
    }

    return GitServiceUtils.getUrlToRepo(url, path, branch);
  };
}

export interface ParsedUrl {
  owner: string;
  repoName: string;
  host: string;
  protocol: string;
}
