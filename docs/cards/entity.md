# Entity card

![Entity light](../images/entity-light.png)
![Entity dark](../images/entity-dark.png)

## Description

A entity card allow you to display an entity.

## Configuration variables

All the options are available in the lovelace editor but you can use `yaml` if you want.

| Name             | Type                                                | Default     | Description                                          |
| :--------------- | :-------------------------------------------------- | :---------- | :--------------------------------------------------- |
| `entity`         | string                                              | Required    | Entity                                               |
| `icon`           | string                                              | Optional    | Custom icon                                          |
| `icon_color`     | string                                              | `blue`      | Custom color for icon when entity is state is active |
| `hide_icon`      | boolean                                             | `false`     | Hide the entity icon                                 |
| `name`           | string                                              | Optional    | Custom name                                          |
| `vertical`       | boolean                                             | `false`     | Vertical layout                                      |
| `primary_info`   | `name` `state` `last-changed` `last-updated` `none` | `name`      | Info to show as primary info                         |
| `secondary_info` | `name` `state` `last-changed` `last-updated` `none` | `state`     | Info to show as secondary info                       |
| `tap_action`     | action                                              | `more-info` | Home assistant action to perform on tap              |
| `hold_action`    | action                                              | `more-info` | Home assistant action to perform on hold             |
