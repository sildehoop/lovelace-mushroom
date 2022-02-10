# Light card

![Light light](../images/light-light.png)
![Light dark](../images/light-dark.png)

## Description

A light card allow you to control a light entity.

## Configuration variables

All the options are available in the lovelace editor but you can use `yaml` if you want.

| Name                      | Type    | Default     | Description                                                       |
| :------------------------ | :------ | :---------- | :---------------------------------------------------------------- |
| `entity`                  | string  | Required    | Light entity                                                      |
| `icon`                    | string  | Optional    | Custom icon                                                       |
| `name`                    | string  | Optional    | Custom name                                                       |
| `vertical`                | boolean | `false`     | Vertical layout                                                   |
| `hide_state`              | boolean | `false`     | Hide the entity state                                             |
| `show_brightness_control` | boolean | `false`     | Show a slider to control brightness                               |
| `show_color_temp_control` | boolean | `false`     | Show a slider to control temperature color                        |
| `show_color_control`      | boolean | `false`     | Show a slider to control RGB color                                |
| `use_light_color`         | boolean | `false`     | Colorize the icon and slider according light temperature or color |
| `tap_action`              | action  | `toggle`    | Home assistant action to perform on tap                           |
| `hold_action`             | action  | `more-info` | Home assistant action to perform on hold                          |
