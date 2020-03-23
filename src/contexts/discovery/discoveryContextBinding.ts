import { Container } from 'inversify';
import { ScanningStrategyDetector } from '../../detectors';
import { RepositoryConfig } from '../../scanner/RepositoryConfig';
import { BitbucketService, GitHubService } from '../../services';
import { GitLabService } from '../../services/gitlab/GitLabService';
import { DiscoveryContextFactory, Types } from '../../types';
import { bindScanningContext } from '../scanner/scannerContextBinding';
import { DiscoveryContext } from './DiscoveryContext';

export const bindDiscoveryContext = (container: Container) => {
  container.bind(Types.DiscoveryContextFactory).toFactory(
    (): DiscoveryContextFactory => {
      return (repositoryConfig: RepositoryConfig) => {
        const discoveryContextContainer = createDiscoveryContainer(repositoryConfig, container);
        return discoveryContextContainer.get(DiscoveryContext);
      };
    },
  );
};

const createDiscoveryContainer = (repositoryConfig: RepositoryConfig, rootContainer: Container): Container => {
  const container = rootContainer.createChild();
  container.bind(Types.RepositoryConfig).toConstantValue(repositoryConfig);

  container.bind(ScanningStrategyDetector).toSelf();

  container.bind(GitHubService).toSelf();
  container.bind(BitbucketService).toSelf();
  container.bind(GitLabService).toSelf();

  container.bind(DiscoveryContext).toSelf();

  bindScanningContext(container);

  return container;
};
