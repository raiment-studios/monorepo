import YAML from 'yaml';

export function stringifyYAML(obj) {
    return YAML.stringify(obj);
}
