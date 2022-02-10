import { HomeAssistant } from "custom-card-helpers";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { LovelaceChip } from ".";
import { actionHandler } from "../../../utils/directives/action-handler-directive";
import { BackChipConfig } from "../../../utils/lovelace/chip/types";
import { LovelaceChipEditor } from "../../../utils/lovelace/types";
import { computeChipComponentName, computeChipEditorComponentName } from "../utils";
import "./back-chip-editor";

@customElement(computeChipComponentName("back"))
export class BackChip extends LitElement implements LovelaceChip {
    public static async getConfigElement(): Promise<LovelaceChipEditor> {
        return document.createElement(computeChipEditorComponentName("back")) as LovelaceChipEditor;
    }

    public static async getStubConfig(_hass: HomeAssistant): Promise<BackChipConfig> {
        return {
            type: `back`,
        };
    }

    @property({ attribute: false }) public hass?: HomeAssistant;

    @state() private _config?: BackChipConfig;

    public setConfig(config: BackChipConfig): void {
        this._config = config;
    }

    private _handleAction() {
        window.history.back();
    }

    protected render(): TemplateResult {
        if (!this.hass || !this._config) {
            return html``;
        }

        const icon = this._config.icon ?? "mdi:arrow-left";

        return html`
            <mushroom-chip @action=${this._handleAction} .actionHandler=${actionHandler()}>
                <ha-icon .icon=${icon}></ha-icon>
            </mushroom-chip>
        `;
    }

    static get styles(): CSSResultGroup {
        return css`
            mushroom-chip {
                cursor: pointer;
            }
        `;
    }
}
