// TRPG Timeline Application - Part 1
class TRPGTimeline {
    constructor() {
        this.scenario = {
            title: 'TRPG 시나리오 타임라인',
            overview: '',
            baseYear: '',
            characters: [
                { id: 1, name: '사건 제목', color: '#3B82F6' },
                { id: 2, name: '등장인물', color: '#EF4444' }
            ]
        };

        this.timeNodes = [
            {
                id: 1,
                timeType: 'custom',
                timeValue: '1일차',
                size: 'small',
                parentTimeNodeId: null,
                order: 0
            },
            {
                id: 2,
                timeType: 'time',
                timeValue: '2일차',
                size: 'small',
                parentTimeNodeId: null,
                order: 1
            }
        ];

        this.events = [
            {
                id: 1,
                timeNodeId: 1,
                type: 'main',
                character: '등장인물',
                title: '사건 제목',
                content: '자세한 사건 내용 및 자료\n\n여기에 상세한 설명을 작성할 수 있습니다.',
                position: 'auto',
                expanded: false,
                attachedToTimeNode: false,
                order: 0
            },
            {
                id: 2,
                timeNodeId: 2,
                type: 'sub',
                character: '사건 제목',
                title: '서브 사건',
                content: '간략한 툴팁 내용입니다.',
                position: 'auto',
                attachedToTimeNode: false,
                order: 0
            }
        ];

        // 테마 설정 추가
        this.theme = {
            background: { type: 'color', value: '#F9FAFB', image: null },
            header: { type: 'color', value: '#FFFFFF', image: null },
            button: { color: '#FFFFFF' },
            buttonPrimary: { color: '#1F2937' },
            timenode: { type: 'color', value: '#1F2937', image: null },
            mainevent: { type: 'color', value: '#FFFFFF', image: null },
            subevent: { type: 'color', value: '#FFFFFF', image: null }
        };

        this.draggedEvent = null;
        this.draggedTime = null;
        this.editingTime = null;
        this.editingEvent = null;
        this.editingCharacter = null;
        this.contextMenuTarget = null;
        this.contextMenuType = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupContextMenu();
        this.setupThemeSettings();
        this.render();
        this.applyTheme();
        this.createIcons();
    }

    createIcons() {
        try {
            if (typeof lucide !== 'undefined' && lucide && lucide.createIcons) {
                lucide.createIcons();
            }
        } catch (error) {
            console.warn('Lucide icons could not be loaded:', error);
        }
    }

    // 색상 대비 계산 함수 (가독성을 위한 텍스트 색상 결정)
    getContrastColor(hexColor) {
        // hex 색상을 RGB로 변환
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // 밝기 계산 (0-255)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        // 밝기가 중간값(128)보다 높으면 검은색, 낮으면 흰색 반환
        return brightness > 128 ? '#000000' : '#FFFFFF';
    }

    // 테마 설정 이벤트 리스너
    setupThemeSettings() {
        // 설정 타입 토글 (단색/이미지)
        document.querySelectorAll('.setting-type-toggle button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const setting = e.target.dataset.setting;
                const type = e.target.dataset.type;
                
                // 형제 버튼들의 active 클래스 제거
                e.target.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // 해당 설정의 입력 요소들 표시/숨김
                const controls = e.target.closest('.setting-controls');
                const colorInput = controls.querySelector('.color-input');
                const imageWrapper = controls.querySelector('.image-upload-wrapper');
                const preview = controls.querySelector('.image-preview');
                
                if (type === 'color') {
                    colorInput.style.display = 'block';
                    imageWrapper.style.display = 'none';
                    preview.style.display = 'none';
                } else {
                    colorInput.style.display = 'none';
                    imageWrapper.style.display = 'block';
                    if (this.theme[setting] && this.theme[setting].image) {
                        preview.style.display = 'block';
                        preview.style.backgroundImage = `url(${this.theme[setting].image})`;
                    }
                }
            });
        });

        // 색상 입력 변화 감지
        ['background', 'header', 'button', 'button-primary', 'timenode', 'mainevent', 'subevent'].forEach(id => {
            const input = document.getElementById(`${id}-color`);
            if (input) {
                input.addEventListener('change', () => {
                    this.updateThemePreview();
                });
            }
        });

        // 이미지 업로드
        ['background', 'header', 'timenode', 'mainevent', 'subevent'].forEach(setting => {
            const input = document.getElementById(`${setting}-image`);
            if (input) {
                input.addEventListener('change', (e) => {
                    this.handleImageUpload(e, setting);
                });
            }
        });

        // 테마 적용 버튼
        const applyBtn = document.getElementById('apply-theme-btn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.saveThemeSettings();
                this.applyTheme();
                this.closeModal('settings-modal');
            });
        }

        // 기본값 초기화 버튼
        const resetBtn = document.getElementById('reset-theme-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetThemeToDefault();
            });
        }
    }

    // 이미지 업로드 처리
    handleImageUpload(event, setting) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            this.theme[setting].image = imageData;
            
            // 미리보기 업데이트
            const preview = document.getElementById(`${setting}-preview`);
            if (preview) {
                preview.style.backgroundImage = `url(${imageData})`;
                preview.style.display = 'block';
            }
            
            this.updateThemePreview();
        };
        reader.readAsDataURL(file);
    }

    // 테마 설정 저장
    saveThemeSettings() {
        // 각 설정의 활성 타입 확인 및 저장
        ['background', 'header', 'timenode', 'mainevent', 'subevent'].forEach(setting => {
            const activeBtn = document.querySelector(`[data-setting="${setting}"].active`);
            if (activeBtn) {
                const type = activeBtn.dataset.type;
                
                this.theme[setting].type = type;
                if (type === 'color') {
                    const colorInput = document.getElementById(`${setting}-color`);
                    if (colorInput) {
                        this.theme[setting].value = colorInput.value;
                    }
                }
            }
        });

        // 버튼 색상
        const buttonColorInput = document.getElementById('button-color');
        const buttonPrimaryColorInput = document.getElementById('button-primary-color');
        
        if (buttonColorInput) {
            this.theme.button.color = buttonColorInput.value;
        }
        if (buttonPrimaryColorInput) {
            this.theme.buttonPrimary.color = buttonPrimaryColorInput.value;
        }
    }

    // 테마 미리보기 업데이트
    updateThemePreview() {
        // 실시간으로 테마 적용해서 미리보기
        this.saveThemeSettings();
        this.applyTheme();
    }

    // 테마 기본값으로 초기화
    resetThemeToDefault() {
        this.theme = {
            background: { type: 'color', value: '#F9FAFB', image: null },
            header: { type: 'color', value: '#FFFFFF', image: null },
            button: { color: '#FFFFFF' },
            buttonPrimary: { color: '#1F2937' },
            timenode: { type: 'color', value: '#1F2937', image: null },
            mainevent: { type: 'color', value: '#FFFFFF', image: null },
            subevent: { type: 'color', value: '#FFFFFF', image: null }
        };

        this.populateThemeSettings();
        this.applyTheme();
    }

    // 테마 설정 모달에 현재 값 채우기
    populateThemeSettings() {
        Object.keys(this.theme).forEach(setting => {
            if (setting === 'button' || setting === 'buttonPrimary') {
                const inputId = setting === 'button' ? 'button-color' : 'button-primary-color';
                const input = document.getElementById(inputId);
                if (input) {
                    input.value = this.theme[setting].color;
                }
                return;
            }

            const themeItem = this.theme[setting];
            
            // 타입 버튼 활성화
            const typeButtons = document.querySelectorAll(`[data-setting="${setting}"]`);
            typeButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.type === themeItem.type);
            });

            // 색상 값 설정
            const colorInput = document.getElementById(`${setting}-color`);
            if (colorInput) {
                colorInput.value = themeItem.value;
            }

            // 이미지 미리보기
            if (themeItem.image) {
                const preview = document.getElementById(`${setting}-preview`);
                if (preview) {
                    preview.style.backgroundImage = `url(${themeItem.image})`;
                    preview.style.display = 'block';
                }
            }

            // 입력 요소 표시/숨김
            const activeBtn = document.querySelector(`[data-setting="${setting}"].active`);
            if (activeBtn) {
                const controls = activeBtn.closest('.setting-controls');
                const colorInputEl = controls.querySelector('.color-input');
                const imageWrapper = controls.querySelector('.image-upload-wrapper');
                const previewEl = controls.querySelector('.image-preview');
                
                if (themeItem.type === 'color') {
                    if (colorInputEl) colorInputEl.style.display = 'block';
                    if (imageWrapper) imageWrapper.style.display = 'none';
                    if (previewEl) previewEl.style.display = 'none';
                } else {
                    if (colorInputEl) colorInputEl.style.display = 'none';
                    if (imageWrapper) imageWrapper.style.display = 'block';
                    if (previewEl) previewEl.style.display = themeItem.image ? 'block' : 'none';
                }
            }
        });
    }

    // 테마 적용
    applyTheme() {
        const body = document.body;
        const header = document.querySelector('.header');

        // 배경 적용
        if (this.theme.background.type === 'color') {
            body.style.backgroundColor = this.theme.background.value;
            body.style.backgroundImage = 'none';
        } else if (this.theme.background.image) {
            body.style.backgroundImage = `url(${this.theme.background.image})`;
            body.style.backgroundSize = 'cover';
            body.style.backgroundPosition = 'center';
            body.style.backgroundAttachment = 'fixed';
        }

        // 헤더 적용
        if (header) {
            if (this.theme.header.type === 'color') {
                header.style.backgroundColor = this.theme.header.value;
                header.style.backgroundImage = 'none';
                
                // 헤더 텍스트 색상 자동 조절
                const textColor = this.getContrastColor(this.theme.header.value);
                header.style.color = textColor;
                
                const title = header.querySelector('h1');
                const metas = header.querySelectorAll('.scenario-meta');
                if (title) title.style.color = textColor;
                metas.forEach(meta => meta.style.color = textColor);
            } else if (this.theme.header.image) {
                header.style.backgroundImage = `url(${this.theme.header.image})`;
                header.style.backgroundSize = 'cover';
                header.style.backgroundPosition = 'center';
                header.style.color = '#FFFFFF';
                header.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
            }
        }

        // 버튼 적용
        const secondaryButtons = document.querySelectorAll('.btn-secondary');
        const primaryButtons = document.querySelectorAll('.btn-primary');
        
        secondaryButtons.forEach(btn => {
            btn.style.backgroundColor = this.theme.button.color;
            btn.style.color = this.getContrastColor(this.theme.button.color);
            btn.style.borderColor = this.theme.button.color;
        });

        primaryButtons.forEach(btn => {
            btn.style.backgroundColor = this.theme.buttonPrimary.color;
            btn.style.color = this.getContrastColor(this.theme.buttonPrimary.color);
        });

        // 시간 노드 적용
        this.applyTimeNodeTheme();
        
        // 이벤트 카드 적용
        this.applyEventTheme();
    }

    // 시간 노드 테마 적용
    applyTimeNodeTheme() {
        const timeLabels = document.querySelectorAll('.time-node-label');
        
        timeLabels.forEach(label => {
            if (this.theme.timenode.type === 'color') {
                label.style.backgroundColor = this.theme.timenode.value;
                label.style.backgroundImage = 'none';
                label.style.color = this.getContrastColor(this.theme.timenode.value);
                label.style.textShadow = 'none';
            } else if (this.theme.timenode.image) {
                label.style.backgroundImage = `url(${this.theme.timenode.image})`;
                label.style.backgroundSize = 'cover';
                label.style.backgroundPosition = 'center';
                label.style.color = '#FFFFFF';
                label.style.textShadow = '1px 1px 2px rgba(0,0,0,0.7)';
            }
        });
    }

    // 이벤트 카드 테마 적용
    applyEventTheme() {
        // 메인 이벤트 카드
        const mainCards = document.querySelectorAll('.main-event-card');
        mainCards.forEach(card => {
            if (this.theme.mainevent.type === 'color') {
                card.style.backgroundColor = this.theme.mainevent.value;
                card.style.backgroundImage = 'none';
                
                const textColor = this.getContrastColor(this.theme.mainevent.value);
                card.style.color = textColor;
                
                const title = card.querySelector('.event-title');
                if (title) {
                    title.style.color = textColor;
                    title.style.textShadow = 'none';
                }
            } else if (this.theme.mainevent.image) {
                card.style.backgroundImage = `url(${this.theme.mainevent.image})`;
                card.style.backgroundSize = 'cover';
                card.style.backgroundPosition = 'center';
                card.style.color = '#FFFFFF';
                
                const title = card.querySelector('.event-title');
                if (title) {
                    title.style.color = '#FFFFFF';
                    title.style.textShadow = '1px 1px 2px rgba(0,0,0,0.7)';
                }
            }
        });

        // 서브 이벤트 카드
        const subCards = document.querySelectorAll('.sub-event-card');
        subCards.forEach(card => {
            if (this.theme.subevent.type === 'color') {
                card.style.backgroundColor = this.theme.subevent.value;
                card.style.backgroundImage = 'none';
                card.style.color = this.getContrastColor(this.theme.subevent.value);
                card.style.textShadow = 'none';
            } else if (this.theme.subevent.image) {
                card.style.backgroundImage = `url(${this.theme.subevent.image})`;
                card.style.backgroundSize = 'cover';
                card.style.backgroundPosition = 'center';
                card.style.color = '#FFFFFF';
                card.style.textShadow = '1px 1px 2px rgba(0,0,0,0.7)';
            }
        });
    }

    setupEventListeners() {
        // 헤더 버튼들
        document.getElementById('scenario-btn').addEventListener('click', () => this.openScenarioModal());
        document.getElementById('settings-btn').addEventListener('click', () => this.openSettingsModal());
        document.getElementById('time-btn').addEventListener('click', () => this.openTimeModal());
        document.getElementById('event-btn').addEventListener('click', () => this.openEventModal());
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());
        document.getElementById('import-file').addEventListener('change', (e) => this.importData(e));

        this.setupModalEvents();
        this.setupFormEvents();
    }

    openSettingsModal() {
        this.populateThemeSettings();
        this.openModal('settings-modal');
    }
}

// TRPG Timeline Application - Part 2 (계속)

    setupContextMenu() {
        const contextMenu = document.getElementById('context-menu');
        const contextEdit = document.getElementById('context-edit');
        const contextDelete = document.getElementById('context-delete');

        document.addEventListener('click', (e) => {
            if (!contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });

        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.timeline-container')) {
                e.preventDefault();
            }
        });

        contextEdit.addEventListener('click', () => {
            this.handleContextEdit();
            this.hideContextMenu();
        });

        contextDelete.addEventListener('click', () => {
            this.handleContextDelete();
            this.hideContextMenu();
        });
    }

    showContextMenu(e, target, type) {
        e.preventDefault();
        e.stopPropagation();

        this.contextMenuTarget = target;
        this.contextMenuType = type;

        const contextMenu = document.getElementById('context-menu');
        contextMenu.style.display = 'block';
        contextMenu.style.left = e.pageX + 'px';
        contextMenu.style.top = e.pageY + 'px';

        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = (e.pageX - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = (e.pageY - rect.height) + 'px';
        }

        this.createIcons();
    }

    hideContextMenu() {
        document.getElementById('context-menu').style.display = 'none';
        this.contextMenuTarget = null;
        this.contextMenuType = null;
    }

    handleContextEdit() {
        if (this.contextMenuType === 'time' && this.contextMenuTarget) {
            this.editTime(this.contextMenuTarget);
        } else if (this.contextMenuType === 'event' && this.contextMenuTarget) {
            this.editEvent(this.contextMenuTarget);
        }
    }

    handleContextDelete() {
        if (this.contextMenuType === 'time' && this.contextMenuTarget) {
            if (confirm('이 시간대를 삭제하시겠습니까? 관련된 모든 사건도 함께 삭제됩니다.')) {
                this.deleteTime(this.contextMenuTarget.id);
            }
        } else if (this.contextMenuType === 'event' && this.contextMenuTarget) {
            if (confirm('이 사건을 삭제하시겠습니까?')) {
                this.deleteEvent(this.contextMenuTarget.id);
            }
        }
    }

    setupModalEvents() {
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.closest('button').dataset.modal;
                this.closeModal(modalId);
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    setupFormEvents() {
        // 시나리오 모달 이벤트
        document.getElementById('add-character-btn').addEventListener('click', () => this.addCharacter());
        document.getElementById('modal-scenario-title').addEventListener('input', (e) => {
            this.scenario.title = e.target.value;
            this.updateHeader();
        });
        document.getElementById('modal-scenario-overview').addEventListener('input', (e) => {
            this.scenario.overview = e.target.value;
            this.updateHeader();
        });
        document.getElementById('modal-scenario-year').addEventListener('input', (e) => {
            this.scenario.baseYear = e.target.value;
            this.updateHeader();
        });

        // 시간 모달 이벤트
        document.getElementById('time-type').addEventListener('change', (e) => this.toggleTimeInputs(e.target.value));
        document.getElementById('save-time-btn').addEventListener('click', () => this.saveTime());

        // 이벤트 모달 이벤트
        document.getElementById('event-type').addEventListener('change', (e) => this.toggleEventFields(e.target.value));
        document.getElementById('save-event-btn').addEventListener('click', () => this.saveEvent());
        document.getElementById('event-content').addEventListener('input', (e) => this.updateCharCount(e.target));
    }

    render() {
        this.updateHeader();
        this.renderTimeline();
        this.updateModalSelects();
    }

    updateHeader() {
        document.getElementById('scenario-title').textContent = this.scenario.title;
        document.getElementById('scenario-base-year').textContent = this.scenario.baseYear ? `기준 년도: ${this.scenario.baseYear}` : '';
        document.getElementById('scenario-overview').textContent = this.scenario.overview;
    }

    renderTimeline() {
        const container = document.getElementById('timeline-content');
        container.innerHTML = '';

        const hierarchicalNodes = this.getHierarchicalTimeNodes();
        
        hierarchicalNodes.forEach((timeNode, index) => {
            const timeNodeElement = this.createTimeNodeElement(timeNode, index, hierarchicalNodes.length);
            container.appendChild(timeNodeElement);
        });

        // 렌더링 후 테마 적용
        setTimeout(() => {
            this.applyTheme();
        }, 10);
    }

    createTimeNodeElement(timeNode, index, totalNodes) {
        const timeNodeEvents = this.events.filter(e => e.timeNodeId === timeNode.id && !e.attachedToTimeNode);
        const attachedEvents = this.events.filter(e => e.timeNodeId === timeNode.id && e.attachedToTimeNode);

        const container = document.createElement('div');
        container.className = 'time-node-container';
        container.style.marginLeft = `${timeNode.depth * 2}rem`;

        // 드롭 존 (위)
        if ((timeNode.timeType === 'time' || timeNode.timeType === 'etc') && index > 0) {
            const dropZone = this.createDropZone('time', timeNode, 'before');
            container.appendChild(dropZone);
        }

        // 붙은 이벤트들
        attachedEvents.forEach((event, eventIndex) => {
            const attachedEvent = this.createAttachedEventElement(event, eventIndex);
            container.appendChild(attachedEvent);
        });
        
        // 시간 노드
        const timeNodeDiv = this.createTimeNode(timeNode);
        container.appendChild(timeNodeDiv);
        
        // 확장된 attached event가 있으면 추가 여백
        const hasExpandedAttached = attachedEvents.some(e => e.expanded);
        if (hasExpandedAttached) {
            container.style.marginBottom = '4rem';
        }
        
        // 이벤트 영역
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'events-container';
        this.setupDropZone(eventsContainer, timeNode.id);

        timeNodeEvents.sort((a, b) => a.order - b.order).forEach((event, eventIndex) => {
            if (eventIndex === 0) {
                const dropZone = this.createDropZone('event', event, 'before');
                eventsContainer.appendChild(dropZone);
            }

            const eventElement = this.createEventElement(event, timeNode.id);
            eventsContainer.appendChild(eventElement);

            const dropZone = this.createDropZone('event', event, 'after');
            eventsContainer.appendChild(dropZone);
        });

        container.appendChild(eventsContainer);

        // 드롭 존 (아래)
        if ((timeNode.timeType === 'time' || timeNode.timeType === 'etc') && index === totalNodes - 1) {
            const dropZone = this.createDropZone('time', timeNode, 'after');
            container.appendChild(dropZone);
        }

        return container;
    }

    createTimeNode(timeNode) {
        const timeNodeDiv = document.createElement('div');
        timeNodeDiv.className = 'time-node';

        const circle = document.createElement('div');
        circle.className = `time-node-circle ${timeNode.size || 'small'}`;
        timeNodeDiv.appendChild(circle);

        const label = document.createElement('div');
        label.className = `time-node-label ${timeNode.size || 'small'}`;
        label.textContent = timeNode.timeValue;
        label.draggable = true;

        const actions = document.createElement('div');
        actions.className = 'time-node-actions';
        actions.innerHTML = `
            <button class="action-btn edit-time" data-time-id="${timeNode.id}">
                <i data-lucide="edit" style="width: 10px; height: 10px;"></i>
            </button>
            <button class="action-btn delete delete-time" data-time-id="${timeNode.id}">
                <i data-lucide="trash-2" style="width: 10px; height: 10px;"></i>
            </button>
        `;
        label.appendChild(actions);

        this.setupTimeNodeEventListeners(label, timeNode);
        timeNodeDiv.appendChild(label);
        return timeNodeDiv;
    }

    createEventElement(event, timeNodeId) {
        const container = document.createElement('div');
        container.className = 'event-item';

        if (event.type === 'main') {
            const position = this.getEventPosition(event, timeNodeId);
            
            const eventHTML = `
                <div class="main-event-wrapper position-${position}">
                    <div class="main-event-side left">
                        ${position === 'left' ? this.createMainEventCard(event) : ''}
                    </div>
                    <div class="main-event-side right">
                        ${position === 'right' ? this.createMainEventCard(event) : ''}
                    </div>
                </div>
            `;
            
            container.innerHTML = eventHTML;
            this.setupMainEventListeners(container, event);
        } else {
            container.innerHTML = `
                <div class="sub-event">
                    <div class="sub-event-card" draggable="true" data-event-id="${event.id}">
                        <div class="sub-event-content">
                            <div class="sub-event-text">${event.title || event.character || '제목 없음'}</div>
                            <div class="event-action-buttons">
                                <button class="action-btn edit-event" data-event-id="${event.id}">
                                    <i data-lucide="edit" style="width: 10px; height: 10px;"></i>
                                </button>
                                <button class="action-btn delete delete-event" data-event-id="${event.id}">
                                    <i data-lucide="trash-2" style="width: 10px; height: 10px;"></i>
                                </button>
                            </div>
                        </div>
                        ${event.content ? `<div class="sub-event-tooltip">${event.content}</div>` : ''}
                    </div>
                </div>
            `;
            this.setupSubEventListeners(container, event);
        }

        return container;
    }

    createMainEventCard(event) {
        return `
            <div class="main-event-card" draggable="true" data-event-id="${event.id}">
                <div class="main-event-header" data-event-id="${event.id}">
                    <div class="main-event-meta">
                        <div>
                            <div class="event-character" style="background-color: ${this.getCharacterColor(event.character)}">
                                ${event.character}
                            </div>
                            <div class="event-title">${event.title}</div>
                        </div>
                        <div class="event-actions">
                            <i class="event-toggle" data-lucide="${event.expanded ? 'chevron-up' : 'chevron-down'}" style="width: 16px; height: 16px;"></i>
                            <div class="event-action-buttons">
                                <button class="action-btn edit-event" data-event-id="${event.id}">
                                    <i data-lucide="edit" style="width: 12px; height: 12px;"></i>
                                </button>
                                <button class="action-btn delete delete-event" data-event-id="${event.id}">
                                    <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                ${event.expanded ? `<div class="event-content">${event.content || '내용이 없습니다.'}</div>` : ''}
            </div>
        `;
    }

    createAttachedEventElement(event, index) {
        const container = document.createElement('div');
        
        let side;
        if (event.position === 'left') {
            side = 'left';
        } else if (event.position === 'right') {
            side = 'right';
        } else {
            const originalPosition = this.getEventPosition(event, event.timeNodeId);
            side = originalPosition;
        }
        
        container.className = `attached-event ${side}`;
        
        const eventHTML = `
            <div class="main-event-wrapper position-${side}">
                <div class="main-event-side left">
                    ${side === 'left' ? this.createMainEventCard(event) : ''}
                </div>
                <div class="main-event-side right">
                    ${side === 'right' ? this.createMainEventCard(event) : ''}
                </div>
            </div>
        `;
        
        container.innerHTML = eventHTML;
        this.setupMainEventListeners(container, event);
        return container;
    }

    getHierarchicalTimeNodes() {
        const rootNodes = this.timeNodes.filter(node => !node.parentTimeNodeId).sort((a, b) => a.order - b.order);
        const result = [];
        
        const addNodeAndChildren = (node, depth = 0) => {
            result.push({ ...node, depth });
            const children = this.timeNodes
                .filter(child => child.parentTimeNodeId === node.id)
                .sort((a, b) => a.order - b.order);
            children.forEach(child => addNodeAndChildren(child, depth + 1));
        };
        
        rootNodes.forEach(node => addNodeAndChildren(node));
        return result;
    }

    getEventPosition(event, timeNodeId) {
        if (event.position !== 'auto') return event.position;
        if (event.type !== 'main') return 'center';
        
        const timeNodeEvents = this.events.filter(e => e.timeNodeId === timeNodeId && e.type === 'main' && e.position === 'auto');
        const eventIndex = timeNodeEvents.findIndex(e => e.id === event.id);
        return eventIndex % 2 === 0 ? 'right' : 'left';
    }

    getCharacterColor(characterName) {
        const character = this.scenario.characters.find(char => char.name === characterName);
        return character ? character.color : '#374151';
    }

    createDropZone(type, target, position) {
        const dropZone = document.createElement('div');
        dropZone.className = type === 'time' ? 'drop-zone' : 'drop-zone event-drop-zone';
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('active');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('active');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('active');

            if (type === 'time') {
                this.handleTimeDropBetween(target, position);
            } else {
                this.handleEventDropBetween(target, position);
            }
        });

        return dropZone;
    }

    setupDropZone(element, timeNodeId) {
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            element.classList.add('drag-over');
        });

        element.addEventListener('dragleave', () => {
            element.classList.remove('drag-over');
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('drag-over');
            this.handleEventDrop(timeNodeId);
        });
    }

    setupTimeNodeEventListeners(label, timeNode) {
        label.addEventListener('contextmenu', (e) => {
            this.showContextMenu(e, timeNode, 'time');
        });

        label.addEventListener('dragstart', (e) => {
            this.draggedTime = timeNode;
            label.classList.add('dragging');
        });

        label.addEventListener('dragend', () => {
            label.classList.remove('dragging');
            this.draggedTime = null;
        });

        label.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.draggedEvent) {
                label.classList.add('time-node-highlight');
            } else if (this.draggedTime && this.draggedTime.id !== timeNode.id) {
                label.classList.add('time-node-drop-highlight');
            }
        });

        label.addEventListener('dragleave', () => {
            label.classList.remove('time-node-highlight', 'time-node-drop-highlight');
        });

        label.addEventListener('drop', (e) => {
            e.preventDefault();
            label.classList.remove('time-node-highlight', 'time-node-drop-highlight');
            
            if (this.draggedEvent) {
                this.handleEventDropOnTimeNode(timeNode.id);
            } else if (this.draggedTime && this.draggedTime.id !== timeNode.id) {
                this.handleTimeDropOnTimeNode(timeNode.id);
            }
        });

        label.querySelector('.edit-time').addEventListener('click', (e) => {
            e.stopPropagation();
            this.editTime(timeNode);
        });

        label.querySelector('.delete-time').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteTime(timeNode.id);
        });
    }

    setupMainEventListeners(container, event) {
        const card = container.querySelector('.main-event-card');
        const header = container.querySelector('.main-event-header');

        if (!card || !header) return;

        card.addEventListener('contextmenu', (e) => {
            this.showContextMenu(e, event, 'event');
        });

        card.addEventListener('dragstart', (e) => {
            this.draggedEvent = event;
            card.classList.add('dragging');
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            this.draggedEvent = null;
        });

        header.addEventListener('click', (e) => {
            if (!this.draggedEvent) {
                this.toggleEventExpansion(event.id);
            }
        });

        const editBtn = container.querySelector('.edit-event');
        const deleteBtn = container.querySelector('.delete-event');

        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editEvent(event);
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteEvent(event.id);
            });
        }
    }

    setupSubEventListeners(container, event) {
        const card = container.querySelector('.sub-event-card');

        if (!card) return;

        card.addEventListener('contextmenu', (e) => {
            this.showContextMenu(e, event, 'event');
        });

        card.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            this.draggedEvent = event;
            card.classList.add('dragging');
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            this.draggedEvent = null;
        });

        const editBtn = container.querySelector('.edit-event');
        const deleteBtn = container.querySelector('.delete-event');

        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editEvent(event);
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteEvent(event.id);
            });
        }
    }

    // 드래그 앤 드롭 핸들러들
    handleEventDrop(targetTimeNodeId, targetOrder = null) {
        if (!this.draggedEvent) return;

        if (this.draggedEvent.timeNodeId === targetTimeNodeId && targetOrder !== null) {
            this.events = this.events.map(event => {
                if (event.timeNodeId !== targetTimeNodeId) return event;
                
                if (event.id === this.draggedEvent.id) {
                    return { ...event, order: targetOrder };
                }
                
                if (this.draggedEvent.order < targetOrder) {
                    if (event.order > this.draggedEvent.order && event.order <= targetOrder) {
                        return { ...event, order: event.order - 1 };
                    }
                } else {
                    if (event.order >= targetOrder && event.order < this.draggedEvent.order) {
                        return { ...event, order: event.order + 1 };
                    }
                }
                
                return event;
            });
        } else {
            const targetTimeEvents = this.events.filter(e => e.timeNodeId === targetTimeNodeId);
            const maxOrder = targetTimeEvents.length > 0 ? Math.max(...targetTimeEvents.map(e => e.order)) : -1;
            
            this.events = this.events.map(event => 
                event.id === this.draggedEvent.id 
                    ? { ...event, timeNodeId: targetTimeNodeId, order: maxOrder + 1, attachedToTimeNode: false }
                    : event
            );
        }
        
        this.draggedEvent = null;
        this.renderTimeline();
        this.createIcons();
    }

    handleEventDropOnTimeNode(targetTimeNodeId) {
        if (!this.draggedEvent) return;

        this.events = this.events.map(event => 
            event.id === this.draggedEvent.id 
                ? { ...event, timeNodeId: targetTimeNodeId, attachedToTimeNode: true, order: 0 }
                : event
        );
        
        this.draggedEvent = null;
        this.renderTimeline();
        this.createIcons();
    }

    handleEventDropBetween(targetEvent, position) {
        if (!this.draggedEvent || this.draggedEvent.id === targetEvent.id) return;

        const targetOrder = position === 'before' ? targetEvent.order : targetEvent.order + 1;
        this.handleEventDrop(targetEvent.timeNodeId, targetOrder);
    }

    handleTimeDropOnTimeNode(targetTimeNodeId) {
        if (!this.draggedTime || this.draggedTime.id === targetTimeNodeId) return;

        if (this.isDescendant(targetTimeNodeId, this.draggedTime.id)) {
            this.draggedTime = null;
            return;
        }

        const targetChildren = this.timeNodes.filter(t => t.parentTimeNodeId === targetTimeNodeId);
        const maxOrder = targetChildren.length > 0 ? Math.max(...targetChildren.map(t => t.order)) : -1;

        this.timeNodes = this.timeNodes.map(time => 
            time.id === this.draggedTime.id 
                ? { ...time, parentTimeNodeId: targetTimeNodeId, order: maxOrder + 1 }
                : time
        );
        
        this.draggedTime = null;
        this.renderTimeline();
        this.createIcons();
    }

    handleTimeDropBetween(targetTimeNode, position) {
        if (!this.draggedTime || this.draggedTime.id === targetTimeNode.id) return;

        const targetOrder = position === 'before' ? targetTimeNode.order : targetTimeNode.order + 1;

        this.timeNodes = this.timeNodes.map(time => {
            if (time.parentTimeNodeId !== targetTimeNode.parentTimeNodeId) return time;
            
            if (time.id === this.draggedTime.id) {
                return { ...time, order: targetOrder, parentTimeNodeId: targetTimeNode.parentTimeNodeId };
            }
            
            if (this.draggedTime.order < targetOrder) {
                if (time.order > this.draggedTime.order && time.order <= targetOrder) {
                    return { ...time, order: time.order - 1 };
                }
            } else {
                if (time.order >= targetOrder && time.order < this.draggedTime.order) {
                    return { ...time, order: time.order + 1 };
                }
            }
            
            return time;
        });
        
        this.draggedTime = null;
        this.renderTimeline();
        this.createIcons();
    }

    isDescendant(nodeId, potentialAncestorId) {
        const node = this.timeNodes.find(n => n.id === nodeId);
        if (!node || !node.parentTimeNodeId) return false;
        if (node.parentTimeNodeId === potentialAncestorId) return true;
        return this.isDescendant(node.parentTimeNodeId, potentialAncestorId);
    }

    toggleEventExpansion(eventId) {
        this.events = this.events.map(event => 
            event.id === eventId 
                ? { ...event, expanded: !event.expanded }
                : event
        );
        
        this.renderTimeline();
        this.createIcons();
        
        setTimeout(() => {
            const expandedElement = document.querySelector(`[data-event-id="${eventId}"]`);
            if (expandedElement) {
                expandedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 100);
    }

    deleteEvent(eventId) {
        this.events = this.events.filter(event => event.id !== eventId);
        this.renderTimeline();
        this.createIcons();
    }

    editEvent(event) {
        this.editingEvent = event;
        this.populateEventModal(event);
        this.openEventModal();
    }

    deleteTime(timeId) {
        const childrenIds = this.timeNodes.filter(t => t.parentTimeNodeId === timeId).map(t => t.id);
        const allIdsToDelete = [timeId, ...childrenIds];
        
        this.timeNodes = this.timeNodes.filter(time => !allIdsToDelete.includes(time.id));
        this.events = this.events.filter(event => !allIdsToDelete.includes(event.timeNodeId));
        this.renderTimeline();
        this.createIcons();
    }

    editTime(timeNode) {
        this.editingTime = timeNode;
        this.populateTimeModal(timeNode);
        this.openTimeModal();
    }

    openScenarioModal() {
        document.getElementById('modal-scenario-title').value = this.scenario.title;
        document.getElementById('modal-scenario-overview').value = this.scenario.overview;
        document.getElementById('modal-scenario-year').value = this.scenario.baseYear;
        this.renderCharactersList();
        this.openModal('scenario-modal');
    }

    openTimeModal() {
        if (!this.editingTime) {
            this.resetTimeModal();
        }
        this.updateParentTimeSelect();
        document.getElementById('time-modal-title').textContent = this.editingTime ? '시간 수정' : '시간 추가';
        document.getElementById('save-time-btn').textContent = this.editingTime ? '수정' : '추가';
        this.openModal('time-modal');
    }

    openEventModal() {
        if (!this.editingEvent) {
            this.resetEventModal();
        }
        this.updateEventTimeSelect();
        this.updateEventCharacterSelect();
        document.getElementById('event-modal-title').textContent = this.editingEvent ? '사건 수정' : '사건 추가';
        document.getElementById('save-event-btn').textContent = this.editingEvent ? '수정' : '추가';
        this.openModal('event-modal');
    }

    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        this.createIcons();
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        if (modalId === 'time-modal') {
            this.editingTime = null;
            this.resetTimeModal();
        }
        if (modalId === 'event-modal') {
            this.editingEvent = null;
            this.resetEventModal();
        }
        if (modalId === 'scenario-modal') {
            this.editingCharacter = null;
            this.resetCharacterForm();
        }
    }

    populateTimeModal(timeNode) {
        document.getElementById('time-type').value = timeNode.timeType;
        document.getElementById('parent-time').value = timeNode.parentTimeNodeId || '';
        document.getElementById('time-size').value = timeNode.size || 'small';
        
        if (timeNode.timeType === 'time') {
            const match = timeNode.timeValue.match(/^(AM|PM)\s+(\d{1,2}):(\d{2})$/);
            if (match) {
                document.getElementById('time-ampm').value = match[1];
                document.getElementById('time-hour').value = match[2];
                document.getElementById('time-minute').value = match[3];
            }
            this.toggleTimeInputs('time');
        } else {
            document.getElementById('time-value').value = timeNode.timeValue;
            this.toggleTimeInputs(timeNode.timeType);
        }
    }

    populateEventModal(event) {
        document.getElementById('event-time').value = event.timeNodeId;
        document.getElementById('event-type').value = event.type;
        document.getElementById('event-character').value = event.character;
        document.getElementById('event-title').value = event.title;
        document.getElementById('event-content').value = event.content;
        document.getElementById('event-position').value = event.position;
        this.toggleEventFields(event.type);
        this.updateCharCount(document.getElementById('event-content'));
    }

    resetTimeModal() {
        document.getElementById('time-type').value = 'year';
        document.getElementById('parent-time').value = '';
        document.getElementById('time-size').value = 'small';
        document.getElementById('time-value').value = '';
        document.getElementById('time-ampm').value = 'AM';
        document.getElementById('time-hour').value = '';
        document.getElementById('time-minute').value = '';
        this.toggleTimeInputs('year');
    }

    resetEventModal() {
        document.getElementById('event-time').value = '';
        document.getElementById('event-type').value = 'main';
        document.getElementById('event-character').value = '';
        document.getElementById('event-title').value = '';
        document.getElementById('event-content').value = '';
        document.getElementById('event-position').value = 'auto';
        this.toggleEventFields('main');
        this.updateCharCount(document.getElementById('event-content'));
    }

    resetCharacterForm() {
        document.getElementById('character-name').value = '';
        document.getElementById('character-color').value = '#3B82F6';
        document.getElementById('add-character-btn').textContent = '추가';
    }

    toggleTimeInputs(timeType) {
        const timeInputs = document.getElementById('time-inputs');
        const timeValueGroup = document.getElementById('time-value-group');
        
        if (timeType === 'time') {
            timeInputs.classList.add('active');
            timeValueGroup.style.display = 'none';
        } else {
            timeInputs.classList.remove('active');
            timeValueGroup.style.display = 'block';
        }
    }

    toggleEventFields(eventType) {
        const positionGroup = document.getElementById('event-position-group');
        const titleLabel = document.getElementById('event-title-label');
        const contentLabel = document.getElementById('event-content-label');
        const contentCount = document.getElementById('event-content-count');
        const contentTextarea = document.getElementById('event-content');
        
        if (eventType === 'main') {
            positionGroup.style.display = 'block';
            titleLabel.textContent = '사건 제목';
            contentLabel.textContent = '상세 내용';
            contentTextarea.removeAttribute('maxlength');
            contentCount.style.display = 'none';
        } else {
            positionGroup.style.display = 'none';
            titleLabel.textContent = '서브 사건 제목';
            contentLabel.textContent = '내용';
            contentTextarea.setAttribute('maxlength', '100');
            contentCount.style.display = 'block';
        }
        this.updateCharCount(contentTextarea);
    }

    updateCharCount(textarea) {
        const count = document.getElementById('event-content-count');
        const eventType = document.getElementById('event-type').value;
        
        if (eventType === 'sub') {
            count.textContent = `${textarea.value.length}/100자`;
        }
    }

    updateModalSelects() {
        this.updateParentTimeSelect();
        this.updateEventTimeSelect();
        this.updateEventCharacterSelect();
    }

    updateParentTimeSelect() {
        const select = document.getElementById('parent-time');
        const currentValue = select.value;
        select.innerHTML = '<option value="">상위 시간대 없음</option>';
        
        this.timeNodes.forEach(timeNode => {
            const option = document.createElement('option');
            option.value = timeNode.id;
            option.textContent = timeNode.timeValue;
            select.appendChild(option);
        });
        
        select.value = currentValue;
    }

    updateEventTimeSelect() {
        const select = document.getElementById('event-time');
        const currentValue = select.value;
        select.innerHTML = '<option value="">시간대를 선택하세요</option>';
        
        const hierarchicalNodes = this.getHierarchicalTimeNodes();
        hierarchicalNodes.forEach(timeNode => {
            const option = document.createElement('option');
            option.value = timeNode.id;
            option.textContent = '  '.repeat(timeNode.depth) + timeNode.timeValue;
            select.appendChild(option);
        });
        
        select.value = currentValue;
    }

    updateEventCharacterSelect() {
        const select = document.getElementById('event-character');
        const currentValue = select.value;
        select.innerHTML = '<option value="">선택하세요</option>';
        
        this.scenario.characters.forEach(character => {
            const option = document.createElement('option');
            option.value = character.name;
            option.textContent = character.name;
            select.appendChild(option);
        });
        
        select.value = currentValue;
    }

    saveTime() {
        const timeType = document.getElementById('time-type').value;
        const parentTimeNodeId = document.getElementById('parent-time').value || null;
        const size = document.getElementById('time-size').value;
        
        let timeValue;
        if (timeType === 'time') {
            const ampm = document.getElementById('time-ampm').value;
            const hour = document.getElementById('time-hour').value;
            const minute = document.getElementById('time-minute').value || '0';
            
            if (!hour) {
                alert('시간을 입력해주세요.');
                return;
            }
            
            timeValue = `${ampm} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
        } else {
            timeValue = document.getElementById('time-value').value;
            if (!timeValue.trim()) {
                alert('시간 값을 입력해주세요.');
                return;
            }
        }

        if (this.editingTime) {
            this.timeNodes = this.timeNodes.map(time => 
                time.id === this.editingTime.id 
                    ? { ...time, timeType, timeValue, size, parentTimeNodeId: parentTimeNodeId ? parseInt(parentTimeNodeId) : null }
                    : time
            );
        } else {
            let targetNodes;
            if (parentTimeNodeId) {
                targetNodes = this.timeNodes.filter(t => t.parentTimeNodeId === parseInt(parentTimeNodeId));
            } else {
                targetNodes = this.timeNodes.filter(t => !t.parentTimeNodeId);
            }
            
            const maxOrder = targetNodes.length > 0 ? Math.max(...targetNodes.map(t => t.order)) : -1;
            
            this.timeNodes.push({
                id: Date.now(),
                timeType,
                timeValue,
                size,
                parentTimeNodeId: parentTimeNodeId ? parseInt(parentTimeNodeId) : null,
                order: maxOrder + 1
            });
        }

        this.closeModal('time-modal');
        this.renderTimeline();
        this.createIcons();
    }

    saveEvent() {
        const timeNodeId = document.getElementById('event-time').value;
        const type = document.getElementById('event-type').value;
        const character = document.getElementById('event-character').value;
        const title = document.getElementById('event-title').value;
        const content = document.getElementById('event-content').value;
        const position = document.getElementById('event-position').value;

        if (!timeNodeId) {
            alert('시간대를 선택해주세요.');
            return;
        }
        
        if (!title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }

        if (this.editingEvent) {
            this.events = this.events.map(event => 
                event.id === this.editingEvent.id 
                    ? { ...event, timeNodeId: parseInt(timeNodeId), type, character, title, content, position }
                    : event
            );
        } else {
            const timeNodeEvents = this.events.filter(e => e.timeNodeId === parseInt(timeNodeId));
            const maxOrder = timeNodeEvents.length > 0 ? Math.max(...timeNodeEvents.map(e => e.order)) : -1;
            
            this.events.push({
                id: Date.now(),
                timeNodeId: parseInt(timeNodeId),
                type,
                character,
                title,
                content,
                position,
                expanded: false,
                attachedToTimeNode: false,
                order: maxOrder + 1
            });
        }

        this.closeModal('event-modal');
        this.renderTimeline();
        this.createIcons();
    }

    addCharacter() {
        const name = document.getElementById('character-name').value.trim();
        const color = document.getElementById('character-color').value;
        
        if (!name) {
            alert('이름을 입력해주세요.');
            return;
        }

        if (this.editingCharacter) {
            this.scenario.characters = this.scenario.characters.map(char => 
                char.id === this.editingCharacter.id 
                    ? { ...char, name, color }
                    : char
            );
            this.editingCharacter = null;
        } else {
            this.scenario.characters.push({
                id: Date.now(),
                name,
                color
            });
        }

        this.resetCharacterForm();
        this.renderCharactersList();
        this.updateEventCharacterSelect();
        this.renderTimeline();
        this.createIcons();
    }

    editCharacter(character) {
        this.editingCharacter = character;
        document.getElementById('character-name').value = character.name;
        document.getElementById('character-color').value = character.color;
        document.getElementById('add-character-btn').textContent = '수정';
    }

    deleteCharacter(characterId) {
        this.scenario.characters = this.scenario.characters.filter(char => char.id !== characterId);
        this.renderCharactersList();
        this.updateEventCharacterSelect();
        this.renderTimeline();
        this.createIcons();
    }

    renderCharactersList() {
        const container = document.getElementById('characters-list');
        container.innerHTML = '';
        
        this.scenario.characters.forEach(character => {
            const item = document.createElement('div');
            item.className = 'character-item';
            item.innerHTML = `
                <div class="character-info">
                    <div class="character-color" style="background-color: ${character.color}"></div>
                    <span class="character-name">${character.name}</span>
                </div>
                <div class="character-actions">
                    <button class="action-btn edit-character" data-character-id="${character.id}">
                        <i data-lucide="edit" style="width: 12px; height: 12px;"></i>
                    </button>
                    <button class="action-btn delete delete-character" data-character-id="${character.id}">
                        <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                    </button>
                </div>
            `;
            
            item.querySelector('.character-name').addEventListener('click', () => {
                this.editCharacter(character);
            });
            
            item.querySelector('.edit-character').addEventListener('click', () => this.editCharacter(character));
            item.querySelector('.delete-character').addEventListener('click', () => this.deleteCharacter(character.id));
            
            container.appendChild(item);
        });
    }

    exportData() {
        const data = {
            scenario: this.scenario,
            timeNodes: this.timeNodes,
            events: this.events,
            theme: this.theme  // 테마 설정도 함께 내보내기
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'trpg-timeline.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.json')) {
            alert('JSON 파일만 업로드할 수 있습니다.');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data || typeof data !== 'object') {
                    alert('올바른 JSON 파일이 아닙니다.');
                    return;
                }
                
                if (!data.scenario) {
                    alert('시나리오 정보가 없습니다. 올바른 TRPG 타임라인 파일이 아닙니다.');
                    return;
                }
                
                if (!data.timeNodes || !Array.isArray(data.timeNodes)) {
                    alert('시간 노드 정보가 없습니다. 올바른 TRPG 타임라인 파일이 아닙니다.');
                    return;
                }
                
                if (!data.events || !Array.isArray(data.events)) {
                    alert('이벤트 정보가 없습니다. 올바른 TRPG 타임라인 파일이 아닙니다.');
                    return;
                }

                // 데이터 로드
                this.scenario = {
                    title: data.scenario.title || 'TRPG 시나리오 타임라인',
                    overview: data.scenario.overview || '',
                    baseYear: data.scenario.baseYear || '',
                    characters: data.scenario.characters || []
                };
                
                this.timeNodes = data.timeNodes;
                this.events = data.events.map(evt => ({ 
                    ...evt, 
                    expanded: false 
                }));

                // 테마 설정 로드 (없으면 기본값 사용)
                if (data.theme) {
                    this.theme = { ...this.theme, ...data.theme };
                }

                this.render();
                this.applyTheme();
                this.createIcons();
                alert('파일을 성공적으로 불러왔습니다!');
                
            } catch (error) {
                console.error('파일 가져오기 오류:', error);
                alert(`파일을 읽는 중 오류가 발생했습니다:\n${error.message}\n\n콘솔을 확인하여 자세한 정보를 확인하세요.`);
            }
        };
        
        reader.onerror = (error) => {
            console.error('파일 읽기 오류:', error);
            alert('파일을 읽을 수 없습니다. 파일이 손상되었을 수 있습니다.');
        };
        
        reader.readAsText(file, 'UTF-8');
        event.target.value = '';
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    new TRPGTimeline();
});
