import {
    ActionHandlerEvent,
    computeStateDisplay,
    handleAction,
    hasAction,
    HomeAssistant,
    LovelaceCard,
    LovelaceCardEditor,
    stateIcon,
} from "custom-card-helpers";
import { HassEntity } from "home-assistant-js-websocket";
import { css, CSSResultGroup, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import "../../shared/badge-icon";
import "../../shared/button";
import "../../shared/shape-icon";
import "../../shared/state-info";
import "../../shared/state-item";
import { cardStyle } from "../../utils/card-styles";
import { registerCustomCard } from "../../utils/custom-cards";
import { actionHandler } from "../../utils/directives/action-handler-directive";
import { LIGHT_CARD_EDITOR_NAME, LIGHT_CARD_NAME, LIGHT_ENTITY_DOMAINS } from "./const";
import "./controls/light-brightness-control";
import "./controls/light-color-temp-control";
import "./controls/light-color-control";
import { LightCardConfig } from "./light-card-config";
import "./light-card-editor";
import {
    getBrightness,
    getRGBColor,
    isLight,
    isSuperLight,
    supportsColorTempControl,
    supportsColorControl,
} from "./utils";
import { isActive } from "../../utils/entity";

type LightCardControl = "brightness_control" | "color_temp_control" | "color_control";

const CONTROLS_ICONS: Record<LightCardControl, string> = {
    brightness_control: "mdi:brightness-4",
    color_temp_control: "mdi:thermometer",
    color_control: "mdi:palette",
};

registerCustomCard({
    type: LIGHT_CARD_NAME,
    name: "Mushroom Light Card",
    description: "Card for light entity",
});

@customElement(LIGHT_CARD_NAME)
export class LightCard extends LitElement implements LovelaceCard {
    public static async getConfigElement(): Promise<LovelaceCardEditor> {
        return document.createElement(LIGHT_CARD_EDITOR_NAME) as LovelaceCardEditor;
    }

    public static async getStubConfig(hass: HomeAssistant): Promise<LightCardConfig> {
        const entities = Object.keys(hass.states);
        const lights = entities.filter((e) => LIGHT_ENTITY_DOMAINS.includes(e.split(".")[0]));
        return {
            type: `custom:${LIGHT_CARD_NAME}`,
            entity: lights[0],
        };
    }

    @property({ attribute: false }) public hass!: HomeAssistant;

    @state() private _config?: LightCardConfig;

    @state() private _activeControl?: LightCardControl;

    @state() private _controls: LightCardControl[] = [];

    _onControlTap(ctrl, e): void {
        e.stopPropagation();
        this._activeControl = ctrl;
    }

    getCardSize(): number | Promise<number> {
        return 1;
    }

    setConfig(config: LightCardConfig): void {
        this._config = {
            tap_action: {
                action: "toggle",
            },
            hold_action: {
                action: "more-info",
            },
            ...config,
        };
        this.setControls();
    }

    protected updated(changedProperties: PropertyValues) {
        super.updated(changedProperties);
        if (this.hass && changedProperties.has("hass")) {
            this.setControls();
        }
    }

    setControls() {
        if (!this._config || !this.hass || !this._config.entity) return;

        const entity_id = this._config.entity;
        const entity = this.hass.states[entity_id];

        if (!entity) return;

        const controls: LightCardControl[] = [];
        if (this._config.show_brightness_control) {
            controls.push("brightness_control");
        }
        if (this._config.show_color_temp_control && supportsColorTempControl(entity)) {
            controls.push("color_temp_control");
        }
        if (this._config.show_color_control && supportsColorControl(entity)) {
            controls.push("color_control");
        }
        this._controls = controls;
        const isActiveControlSupported = this._activeControl
            ? controls.includes(this._activeControl)
            : false;
        this._activeControl = isActiveControlSupported ? this._activeControl : controls[0];
    }

    private _handleAction(ev: ActionHandlerEvent) {
        handleAction(this, this.hass!, this._config!, ev.detail.action!);
    }

    protected render(): TemplateResult {
        if (!this._config || !this.hass || !this._config.entity) {
            return html``;
        }

        const entity_id = this._config.entity;
        const entity = this.hass.states[entity_id];

        const name = this._config.name ?? entity.attributes.friendly_name;
        const icon = this._config.icon ?? stateIcon(entity);

        const vertical = !!this._config.vertical;
        const hideState = !!this._config.hide_state;

        const active = isActive(entity);

        const stateDisplay = computeStateDisplay(this.hass.localize, entity, this.hass.locale);

        const brightness = getBrightness(entity);

        const stateValue = brightness != null ? `${brightness}%` : stateDisplay;

        const lightRgbColor = getRGBColor(entity);
        const iconStyle = {};
        if (lightRgbColor && this._config?.use_light_color) {
            const color = lightRgbColor.join(",");
            iconStyle["--icon-color"] = `rgb(${color})`;
            iconStyle["--shape-color"] = `rgba(${color}, 0.25)`;
            if (isLight(lightRgbColor) && !(this.hass.themes as any).darkMode) {
                iconStyle["--shape-outline-color"] = `rgba(var(--rgb-primary-text-color), 0.05)`;
                if (isSuperLight(lightRgbColor)) {
                    iconStyle["--icon-color"] = `rgba(var(--rgb-primary-text-color), 0.2)`;
                }
            }
        }

        return html`
            <ha-card>
                <div class="container">
                    <mushroom-state-item
                        .vertical=${vertical}
                        @action=${this._handleAction}
                        .actionHandler=${actionHandler({
                            hasHold: hasAction(this._config.hold_action),
                        })}
                    >
                        <mushroom-shape-icon
                            slot="icon"
                            .disabled=${!active}
                            .icon=${icon}
                            style=${styleMap(iconStyle)}
                        ></mushroom-shape-icon>
                        ${entity.state === "unavailable"
                            ? html` <mushroom-badge-icon
                                  class="unavailable"
                                  slot="badge"
                                  icon="mdi:help"
                              ></mushroom-badge-icon>`
                            : null}
                        <mushroom-state-info
                            slot="info"
                            .primary=${name}
                            .secondary=${!hideState && stateValue}
                        ></mushroom-state-info>
                    </mushroom-state-item>
                    ${this._controls.length > 0
                        ? html`
                              <div class="actions">
                                  ${this.renderActiveControl(entity)} ${this.renderOtherControls()}
                              </div>
                          `
                        : null}
                </div>
            </ha-card>
        `;
    }

    private renderOtherControls(): TemplateResult | null {
        const otherControls = this._controls.filter((control) => control != this._activeControl);

        return html`
            ${otherControls.map(
                (ctrl) => html`
                    <mushroom-button
                        .icon=${CONTROLS_ICONS[ctrl]}
                        @click=${(e) => this._onControlTap(ctrl, e)}
                    />
                `
            )}
        `;
    }

    private renderActiveControl(entity: HassEntity): TemplateResult | null {
        switch (this._activeControl) {
            case "brightness_control":
                const lightRgbColor = getRGBColor(entity);
                const sliderStyle = {};
                if (lightRgbColor && this._config?.use_light_color) {
                    const color = lightRgbColor.join(",");
                    sliderStyle["--slider-color"] = `rgb(${color})`;
                    sliderStyle["--slider-bg-color"] = `rgba(${color}, 0.2)`;
                    if (isLight(lightRgbColor) && !(this.hass.themes as any).darkMode) {
                        sliderStyle[
                            "--slider-bg-color"
                        ] = `rgba(var(--rgb-primary-text-color), 0.05)`;
                        sliderStyle["--slider-color"] = `rgba(var(--rgb-primary-text-color), 0.15)`;
                    }
                }
                return html`
                    <mushroom-light-brightness-control
                        .hass=${this.hass}
                        .entity=${entity}
                        style=${styleMap(sliderStyle)}
                    />
                `;
            case "color_temp_control":
                return html`
                    <mushroom-light-color-temp-control .hass=${this.hass} .entity=${entity} />
                `;
            case "color_control":
                return html`
                    <mushroom-light-color-control .hass=${this.hass} .entity=${entity} />
                `;
            default:
                return null;
        }
    }

    static get styles(): CSSResultGroup {
        return [
            cardStyle,
            css`
                ha-card {
                    border-radius: 20px;
                }
                mushroom-state-item {
                    cursor: pointer;
                }
                mushroom-shape-icon {
                    --icon-color: rgb(var(--rgb-state-light));
                    --shape-color: rgba(var(--rgb-state-light), 0.2);
                }
                mushroom-light-brightness-control,
                mushroom-light-color-temp-control,
                mushroom-light-color-control {
                    flex: 1;
                }
            `,
        ];
    }
}
