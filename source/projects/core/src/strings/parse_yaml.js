import YAML from 'yaml';

export function parseYAML(s) {
    return YAML.parse(s);
}
