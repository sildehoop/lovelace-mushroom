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
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "../../shared/badge-icon";
import "../../shared/button";
import "../../shared/shape-icon";
import "../../shared/state-info";
import "../../shared/state-item";
import { cardStyle } from "../../utils/card-styles";
import { registerCustomCard } from "../../utils/custom-cards";
import { actionHandler } from "../../utils/directives/action-handler-directive";
import { isActive } from "../../utils/entity";
import { COVER_CARD_EDITOR_NAME, COVER_CARD_NAME, COVER_ENTITY_DOMAINS } from "./const";
import "./controls/cover-buttons-control";
import "./controls/cover-position-control";
import { CoverCardConfig } from "./cover-card-config";
import "./cover-card-editor";
import { getPosition } from "./utils";

type CoverCardControl = "buttons_control" | "position_control";

const CONTROLS_ICONS: Record<CoverCardControl, string> = {
    buttons_control: "mdi:gesture-tap-button",
    position_control: "mdi:gesture-swipe-horizontal",
};

registerCustomCard({
    type: COVER_CARD_NAME,
    name: "Mushroom Cover Card",
    description: "Card for cover entity",
});

@customElement(COVER_CARD_NAME)
export class CoverCard extends LitElement implements LovelaceCard {
    public static async getConfigElement(): Promise<LovelaceCardEditor> {
        return document.createElement(COVER_CARD_EDITOR_NAME) as LovelaceCardEditor;
    }

    public static async getStubConfig(hass: HomeAssistant): Promise<CoverCardConfig> {
        const entities = Object.keys(hass.states);
        const covers = entities.filter((e) => COVER_ENTITY_DOMAINS.includes(e.split(".")[0]));
        return {
            type: `custom:${COVER_CARD_NAME}`,
            entity: covers[0],
        };
    }

    @property({ attribute: false }) public hass!: HomeAssistant;

    @state() private _config?: CoverCardConfig;

    @state() private _activeControl?: CoverCardControl;

    @state() private _controls: CoverCardControl[] = [];

    get _nextControl(): CoverCardControl | undefined {
        if (this._activeControl) {
            return (
                this._controls[this._controls.indexOf(this._activeControl) + 1] ?? this._controls[0]
            );
        }
        return undefined;
    }

    private _onNextControlTap(e): void {
        e.stopPropagation();
        this._activeControl = this._nextControl;
    }

    getCardSize(): number | Promise<number> {
        return 1;
    }

    setConfig(config: CoverCardConfig): void {
        this._config = {
            tap_action: {
                action: "toggle",
            },
            hold_action: {
                action: "more-info",
            },
            ...config,
        };
        const controls: CoverCardControl[] = [];
        if (this._config?.show_buttons_control) {
            controls.push("buttons_control");
        }
        if (this._config?.show_position_control) {
            controls.push("position_control");
        }
        this._controls = controls;
        this._activeControl = controls[0];
    }

    private _handleAction(ev: ActionHandlerEvent) {
        handleAction(this, this.hass!, this._config!, ev.detail.action!);
    }

    protected render(): TemplateResult {
        if (!this.hass || !this._config || !this._config.entity) {
            return html``;
        }

        const entity_id = this._config.entity;
        const entity = this.hass.states[entity_id];

        const name = this._config.name ?? entity.attributes.friendly_name;
        const icon = this._config.icon ?? stateIcon(entity);
        const vertical = this._config.vertical;
        const hideState = this._config.hide_state;

        const stateDisplay = computeStateDisplay(this.hass.localize, entity, this.hass.locale);

        const position = getPosition(entity);

        let stateValue = `${stateDisplay}`;
        if (position) {
            stateValue += ` - ${position}%`;
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
                            .disabled=${!isActive(entity)}
                            .icon=${icon}
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
                                  ${this.renderActiveControl(entity)}
                                  ${this.renderNextControlButton()}
                              </div>
                          `
                        : null}
                </div>
            </ha-card>
        `;
    }

    private renderNextControlButton(): TemplateResult | null {
        if (!this._nextControl || this._nextControl == this._activeControl) return null;

        return html`
            <mushroom-button
                .icon=${CONTROLS_ICONS[this._nextControl]}
                @click=${this._onNextControlTap}
            />
        `;
    }

    private renderActiveControl(entity: HassEntity): TemplateResult | null {
        switch (this._activeControl) {
            case "buttons_control":
                return html`
                    <mushroom-cover-buttons-control .hass=${this.hass} .entity=${entity} />
                `;
            case "position_control":
                return html`
                    <mushroom-cover-position-control .hass=${this.hass} .entity=${entity} />
                `;
            default:
                return null;
        }
    }

    static get styles(): CSSResultGroup {
        return [
            cardStyle,
            css`
                mushroom-state-item {
                    cursor: pointer;
                }
                mushroom-shape-icon {
                    --icon-color: rgb(var(--rgb-state-cover));
                    --shape-color: rgba(var(--rgb-state-cover), 0.2);
                }
                mushroom-cover-buttons-control,
                mushroom-cover-position-control {
                    flex: 1;
                }
            `,
        ];
    }
}
