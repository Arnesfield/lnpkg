import Arborist from '@npmcli/arborist';

export async function loadNode(path: string): Promise<Arborist.Node> {
  // need to create new Arborist instance every init
  // NOTE: reading from source @npmcli/arborist loadActual:
  // ignoreMissing - skip findMissingEdges
  // filter - ignore anything related to reading fs since we only need the package
  const arborist = new Arborist({
    path,
    ignoreMissing: true,
    filter: () => false
  });
  // expect loadActual to already check and validate package.json file
  const node = await arborist.loadActual();
  if (node.errors.length === 1) {
    throw node.errors[0];
  } else if (node.errors.length > 1) {
    throw new Error('Unable to load package path.', { cause: node.errors });
  }
  return node;
}
