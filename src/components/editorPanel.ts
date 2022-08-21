import { cfg, shared } from "../globals";
import { items, reflowLatex, sanitizeLaTeX } from "../utils";
import { PwTabMenu } from "./pwTabMenu";
import { createToolbarButton } from "./toolbar/createToolbarButton";
import tbConfig from "./toolbar/toolbar-config"

// Editor panel
export class EditorPanel {
    parent: JQuery<HTMLDivElement>;
    gid: string;
    wrong_attemps: number;
    standalone: boolean;
    status: number;
    panel: JQuery<HTMLDivElement>;
    palettes: PwTabMenu;
    mathInput: any;
    check_el: JQuery<HTMLDivElement> | undefined;
    feedback_el: JQuery<HTMLDivElement>;
    def: any;

    constructor(parent: JQuery<HTMLDivElement>, gid: string, standalone?: boolean) {
        const self = this;
        this.parent = parent;
        this.gid = gid;
        this.wrong_attemps = 0;
        this.standalone = standalone || false;
        this.status = cfg.STATUS.UNMODIFIED;
        this.panel = $('<div class="pw-me-editorpanel" style="position:relative"></div>') as JQuery<HTMLDivElement>;
        this.parent.append(this.panel);

        this.palettes = new PwTabMenu(this.panel);


        const spanMathInput = $('<span class="pw-me-editorpanel-mathinput"></span>');
        spanMathInput.on("click", function (ev) {
            ev.preventDefault();
            $('.pw-me-btn-dropdownmenu').css("display", "none");
        });
        this.panel.append(spanMathInput);
        this.mathInput = shared.MQ.MathField(spanMathInput[0], {
            handlers: {
                edit() {
                    if (standalone && self.status != cfg.STATUS.MODIFIED) {
                        self.check_el && self.check_el.html('');
                        self.status = cfg.STATUS.MODIFIED;
                    }
                }
            }
        });

        if (this.standalone) {
            this.check_el = $('<div></div>') as JQuery<HTMLDivElement>;
            this.panel.append(this.check_el);
        }

        this.feedback_el = $('<div class="pw-mq-feedback" style="display:none;"></div>') as JQuery<HTMLDivElement>;
        this.panel.append(this.feedback_el);

        //Add button to palettes
        items(tbConfig.button_meta, function (name: string, btnInfo: any) {
            const tabName = tbConfig.default_toolbar_tabs[btnInfo.tab - 1];
            self.palettes.addTab(tabName);

            // create and add button to palette  
            const aButton = createToolbarButton(self.panel, btnInfo, name, self.mathInput);
            self.palettes.addContentsToTab(tabName, aButton);
        })

    }

    get $div() {
        return this.panel
    }

    clear() {
        this.mathInput.latex('');
        this.check_el && this.check_el.html('');
        this.status = cfg.STATUS.UNMODIFIED;
    }

    focus() {
        this.mathInput.focus();
    }

    latex(tex?: string): string {
        if (tex != null) {
            this.mathInput.latex(tex);
            this.status = cfg.STATUS.UNMODIFIED;
        } else {
            return sanitizeLaTeX(this.mathInput.latex());
        }
        return ''
    }

    checkMsg(status: number, msg: string) {
        if (this.standalone) {
            this.status = status;
            let msg2: string = '';
            if (status == 1) {
                msg2 = '<span style="color:green;margin:5px;"><i class="fas fa-check"></i> ' + msg + '</span>';
            } else if (status == 0) {
                msg2 = '<span style="color:darkred;margin:5px;"><i class="fas fa-times"></i> ' + msg + '</span>';
            } else {
                msg2 = '<span style="color:purple;margin:5px;"><i class="fas fa-exclamation-triangle"></i> ' + msg + '</span>';
            }
            this.check_el && this.check_el.html(msg2);
        }
    }

    get_qid() {
        return this.mathInput.id;
    }

    showPalette(name: string, visible: boolean) {
        this.palettes.setVisible(name, visible);
    }

    dispose() {
        this.mathInput.revert();
        this.panel.find("button").off();
        this.palettes.dispose();
    }
    reflow() {
        this.mathInput.reflow();
        this.status = cfg.STATUS.UNMODIFIED;
    }
    setDefinition(def: any) {
        this.def = def;
        const self = this;
        if (def.palettes == 'all') {
            // Show all palettes
            // enable general palette
            tbConfig.default_toolbar_tabs.forEach(function (name) {
                self.palettes.setVisible(name, true);
            });
            this.palettes.setTab('General');
        }
        // According to definition.palettes prepare the correct palettes
        else if (def.palettes && def.palettes.length) {
            // show this palettes
            // set to first palette
            let firstSelected = null
            let num_visible = 0;
            tbConfig.default_toolbar_tabs.forEach(function (name) {
                let found = false;
                let j = 0;
                while (!found && j < def.palettes.length) {
                    found = def.palettes[j].toLowerCase().trim() == name.toLowerCase().trim();
                    if (found && j == 0) {
                        firstSelected = name;
                    }
                    if (found) {
                        num_visible += 1;
                    }
                    j += 1;
                }
                self.palettes.setVisible(name, found);
            });
            if (num_visible == 0 || !firstSelected) {
                this.palettes.setVisible('General', true);
            }
            this.palettes.setTab(firstSelected || 'General');
        } else {
            // Only show the general palette
            // enable general palette
            tbConfig.default_toolbar_tabs.forEach(function (name) {
                self.palettes.setVisible(name, name == 'General');
            });
            this.palettes.setTab('General');
        }
    }
    showAnswer() {
        if (!this.def.right_answer) {
            console.log(this.def);
            console.error("Cannot show answer because, ", this.def.right_answer);
            return;
        }
        this.feedback_el.css("display", "");
        this.feedback_el.html(atob(this.def.right_answer) + '<p><br></p>');
        reflowLatex();
    }
    increment_wrong() {
        this.wrong_attemps += 1;
    }

};