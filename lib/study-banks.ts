export type Difficulty="facil"|"medio"|"avancado";
export type StudyQuestion={text:string;options:string[];correct:number;explanation:string;difficulty?:Difficulty};
export type StudyNiche="agronomia"|"agricultura"|"zootecnia"|"veterinaria";

export const nicheInfo:Record<StudyNiche,{name:string;icon:string;description:string}>={
  agronomia:{name:"Agronomia",icon:"🌱",description:"Solos, nutrição, fisiologia e manejo"},
  agricultura:{name:"Agricultura",icon:"🚜",description:"Cultivos, máquinas, irrigação e produção"},
  zootecnia:{name:"Zootecnia",icon:"🐄",description:"Nutrição, genética, pastagens e produção animal"},
  veterinaria:{name:"Veterinária",icon:"🩺",description:"Saúde, anatomia, prevenção e clínica animal"},
};

export const categoryCatalog=[
 {id:"gerais",name:"Conhecimentos Gerais",icon:"🧠",priority:true,subs:["História","Geografia","Ciências","Biologia","Química","Física","Matemática","Língua Portuguesa","Inglês","Literatura","Filosofia"]},
 {id:"entretenimento",name:"Filmes e Séries",icon:"🎬",priority:true,subs:["Filmes","Séries","Celebridades","Desenhos Animados","Anime"]},
 {id:"musica",name:"Música",icon:"🎵",priority:true,subs:["Música brasileira","Música internacional","Artistas e bandas"]},
 {id:"esportes",name:"Futebol",icon:"⚽",priority:true,subs:["Futebol","Clubes e Seleções","Regras Esportivas","Fórmula 1","Vôlei","Basquete","Olimpíadas"]},
 {id:"cultura-pop",name:"Cultura Pop",icon:"🍿",priority:true,subs:["Cultura Pop","Jogos e Videogames","Memes e Internet"]},
 {id:"infantil",name:"Quiz Infantil",icon:"🧩",priority:true,subs:["Animais","Cores e Formas","Contos e Fábulas","Adivinhações","Personagens Infantis","Escola e Aprendizado","Verdadeiro ou Falso"]},
 {id:"tecnologia",name:"Tecnologia",icon:"💻",priority:true,subs:["Informática","Inteligência Artificial","Programação","Segurança Digital","Redes Sociais","Celulares e Aplicativos","História da Tecnologia","Internet"]},
 {id:"biblia",name:"Bíblia",icon:"📖",priority:true,subs:["Bíblia","Religiões","Mitologia"]},
 {id:"agro",name:"Agro",icon:"🌿",priority:true,ready:true,subs:["Agronomia","Agricultura","Zootecnia","Veterinária","Solos e Fertilidade","Máquinas Agrícolas","Fitossanidade","Nutrição de Plantas","Pecuária","Agricultura Digital","Clima e Meteorologia","Biológicos","Defensivos Agrícolas"]},
 {id:"empresas",name:"Profissões e Empresas",icon:"💼",subs:["Administração","Vendas","Marketing","Empreendedorismo","Finanças","Contabilidade","Recursos Humanos","Atendimento ao Cliente","Liderança","Segurança do Trabalho","Compliance","Treinamentos Corporativos"]},
 {id:"saude",name:"Saúde e Bem-estar",icon:"🩺",subs:["Medicina","Enfermagem","Nutrição","Primeiros Socorros","Anatomia Humana","Saúde Bucal","Exercícios Físicos","Hábitos Saudáveis"]},
 {id:"cultura",name:"Cultura e Sociedade",icon:"🌎",subs:["Festas Populares","Tradições Brasileiras","Países e Bandeiras","Capitais do Mundo","Línguas e Expressões"]},
 {id:"cotidiano",name:"Cotidiano",icon:"🏠",subs:["Gastronomia","Receitas e Alimentos","Trânsito","Automóveis","Viagens","Turismo","Casa e Organização","Sustentabilidade","Meio Ambiente"]},
] as const;

export const studyBanks:Record<StudyNiche,StudyQuestion[]>={
agronomia:[
 {text:"Qual propriedade do solo representa sua capacidade de reter cátions nutrientes?",options:["Condutividade hidráulica","Capacidade de troca catiônica","Densidade de partículas","Ponto de murcha"],correct:1,explanation:"A capacidade de troca catiônica indica quanto o solo consegue reter e trocar cátions como Ca²⁺, Mg²⁺ e K⁺."},
 {text:"Em solos muito ácidos, qual elemento pode atingir níveis tóxicos para as raízes?",options:["Alumínio","Molibdênio","Sódio","Silício"],correct:0,explanation:"Em pH baixo, o alumínio torna-se mais solúvel e pode restringir o crescimento radicular."},
 {text:"Qual nutriente é componente central da molécula de clorofila?",options:["Cálcio","Magnésio","Enxofre","Boro"],correct:1,explanation:"O átomo central da clorofila é o magnésio, essencial ao processo fotossintético."},
 {text:"A maior parte do fósforo chega à superfície das raízes por qual mecanismo?",options:["Fluxo de massa","Difusão","Volatilização","Lixiviação"],correct:1,explanation:"Devido à baixa mobilidade do fósforo no solo, a difusão é o principal mecanismo de transporte até as raízes."},
 {text:"O que a calagem busca corrigir prioritariamente?",options:["Salinidade e sodicidade","Acidez e alumínio tóxico","Compactação mecânica","Déficit hídrico"],correct:1,explanation:"A calagem eleva o pH, neutraliza alumínio tóxico e fornece cálcio e magnésio."},
 {text:"Qual tecido vegetal transporta principalmente água e sais minerais das raízes?",options:["Floema","Xilema","Câmbio","Epiderme"],correct:1,explanation:"O xilema conduz a seiva bruta, formada principalmente por água e nutrientes minerais."},
 {text:"Deficiência de nitrogênio tende a aparecer primeiro em quais folhas?",options:["Folhas jovens","Folhas mais velhas","Somente flores","Somente cotilédones"],correct:1,explanation:"Como o nitrogênio é móvel na planta, ele é remobilizado das folhas velhas para tecidos jovens."},
 {text:"Qual relação descreve corretamente textura e estrutura do solo?",options:["Ambas significam apenas teor de argila","Textura é o arranjo; estrutura é a proporção de partículas","Textura é a proporção de partículas; estrutura é seu arranjo","Estrutura não interfere na porosidade"],correct:2,explanation:"Textura refere-se às proporções de areia, silte e argila; estrutura, ao modo como essas partículas se agregam."},
 {text:"A matéria orgânica pode melhorar qual conjunto de atributos?",options:["Apenas a cor","Agregação, retenção de água e CTC","Somente o teor de areia","Apenas a temperatura"],correct:1,explanation:"A matéria orgânica favorece agregação, retenção hídrica, atividade biológica e capacidade de troca."},
 {text:"Qual micronutriente está diretamente ligado à fixação biológica de nitrogênio?",options:["Molibdênio","Cloro","Níquel apenas em excesso","Silício"],correct:0,explanation:"O molibdênio participa da nitrogenase e da redutase do nitrato, enzimas centrais no metabolismo do nitrogênio."},
],
agricultura:[
 {text:"Qual condição define melhor a capacidade de campo do solo?",options:["Solo totalmente seco","Água restante após drenagem gravitacional","Saturação permanente","Água indisponível às plantas"],correct:1,explanation:"Capacidade de campo é a umidade retida após o excesso de água gravitacional ter drenado."},
 {text:"No plantio direto, qual prática é fundamental para proteger o solo?",options:["Revolvimento intenso anual","Manutenção de palhada","Queima dos resíduos","Eliminação da rotação"],correct:1,explanation:"A cobertura permanente com palhada reduz erosão, conserva umidade e alimenta a biologia do solo."},
 {text:"A rotação de culturas ajuda principalmente a:",options:["Aumentar a dependência de um único herbicida","Quebrar ciclos de pragas e diversificar raízes","Eliminar toda adubação","Uniformizar doenças"],correct:1,explanation:"Alternar espécies interrompe ciclos biológicos e explora diferentes camadas e recursos do solo."},
 {text:"Qual sistema de irrigação geralmente apresenta alta eficiência de aplicação localizada?",options:["Sulcos","Inundação","Gotejamento","Aspersão sem controle"],correct:2,explanation:"O gotejamento aplica água próxima às raízes e pode reduzir perdas por evaporação e deriva."},
 {text:"O que significa regulagem da população de plantas?",options:["Definir número de plantas por área","Aumentar apenas a largura do trator","Medir somente a chuva","Escolher a cor da semente"],correct:0,explanation:"A população resulta do espaçamento, número de sementes e estabelecimento efetivo das plantas."},
 {text:"Em pulverização, gotas muito finas aumentam principalmente o risco de:",options:["Compactação","Deriva","Salinização","Acamamento"],correct:1,explanation:"Gotas finas têm menor massa e são transportadas mais facilmente pelo vento."},
 {text:"A colheita com grãos excessivamente úmidos pode aumentar:",options:["Danos e custos de secagem","A germinação no armazém obrigatoriamente","A pureza genética","A resistência mecânica"],correct:0,explanation:"Maior umidade favorece danos, deterioração e necessidade de secagem artificial."},
 {text:"Qual é o objetivo básico de uma curva de nível?",options:["Concentrar enxurradas","Reduzir velocidade do escoamento","Aumentar declividade","Eliminar infiltração"],correct:1,explanation:"Operações em nível diminuem a velocidade da água e o risco de erosão."},
 {text:"O monitoramento no manejo integrado de pragas serve para:",options:["Aplicar defensivo por calendário sempre","Decidir com base em população e nível de ação","Eliminar inimigos naturais","Ignorar danos econômicos"],correct:1,explanation:"O MIP utiliza amostragem e níveis de ação para evitar aplicações desnecessárias."},
 {text:"Qual fator deve orientar a escolha da época de semeadura?",options:["Somente preço do combustível","Zoneamento, clima e ciclo da cultivar","Apenas tamanho da propriedade","Cor do solo isoladamente"],correct:1,explanation:"A janela recomendada considera risco climático, disponibilidade hídrica e ciclo da cultivar."},
],
zootecnia:[
 {text:"Qual compartimento é o principal local de fermentação em bovinos?",options:["Abomaso","Rúmen","Duodeno","Ceco"],correct:1,explanation:"O rúmen abriga microrganismos que fermentam fibras e outros componentes da dieta."},
 {text:"A conversão alimentar relaciona:",options:["Consumo de alimento e ganho de peso","Idade e temperatura","Peso e altura apenas","Água e luminosidade"],correct:0,explanation:"A conversão mede quanto alimento é necessário para produzir uma unidade de ganho ou produto."},
 {text:"Qual nutriente é geralmente o mais crítico em quantidade para os animais?",options:["Água","Vitamina K","Cobre","Iodo"],correct:0,explanation:"A água participa de praticamente todos os processos fisiológicos e é requerida em grande quantidade."},
 {text:"O escore de condição corporal avalia principalmente:",options:["Reserva energética do animal","Pureza racial","Comprimento do casco","Temperatura retal"],correct:0,explanation:"O escore estima as reservas de gordura e auxilia decisões nutricionais e reprodutivas."},
 {text:"O pastejo rotacionado caracteriza-se por:",options:["Acesso contínuo a toda área","Alternância entre períodos de ocupação e descanso","Ausência de divisão de pastos","Eliminação do manejo de lotação"],correct:1,explanation:"A divisão em piquetes permite controlar desfolha e recuperação da forrageira."},
 {text:"Na silagem, a conservação adequada depende principalmente de:",options:["Ambiente com muito oxigênio","Fermentação anaeróbia e rápida queda do pH","Exposição constante à chuva","Secagem completa como feno"],correct:1,explanation:"A exclusão de oxigênio favorece fermentação lática e estabilização ácida do material."},
 {text:"Heterose é o desempenho superior associado principalmente ao:",options:["Cruzamento entre linhagens ou raças","Aumento da consanguinidade","Jejum prolongado","Desmame tardio obrigatório"],correct:0,explanation:"A heterose, ou vigor híbrido, resulta da combinação genética de populações distintas."},
 {text:"Qual indicador representa a proporção de fêmeas expostas que ficam gestantes?",options:["Taxa de lotação","Taxa de prenhez","Rendimento de carcaça","Ganho médio diário"],correct:1,explanation:"A taxa de prenhez é um indicador reprodutivo central do rebanho."},
 {text:"O conforto térmico influencia diretamente:",options:["Consumo, produção e reprodução","Somente a cor da pelagem","Apenas o peso ao nascer","Somente o casco"],correct:0,explanation:"Estresse térmico altera ingestão, metabolismo, imunidade e desempenho reprodutivo."},
 {text:"Qual medida reduz a seleção de parasitas resistentes?",options:["Usar sempre o mesmo princípio ativo","Tratamento seletivo e rotação baseada em diagnóstico","Tratar sem avaliar eficácia","Subdosar todos os animais"],correct:1,explanation:"Diagnóstico, dose correta, tratamento seletivo e avaliação de eficácia retardam a resistência."},
],
veterinaria:[
 {text:"Qual termo descreve doença transmissível naturalmente entre animais e humanos?",options:["Iatrogenia","Zoonose","Displasia","Anamnese"],correct:1,explanation:"Zoonoses são infecções ou doenças transmissíveis entre animais vertebrados e seres humanos."},
 {text:"A vacinação produz principalmente qual tipo de imunidade?",options:["Passiva natural","Ativa adquirida","Inata absoluta","Passiva artificial obrigatória"],correct:1,explanation:"A vacina estimula o próprio organismo a produzir resposta e memória imunológica."},
 {text:"Qual sinal vital deve ser avaliado junto com frequência cardíaca e respiratória?",options:["Cor da pelagem","Temperatura corporal","Comprimento da cauda","Peso histórico apenas"],correct:1,explanation:"Temperatura, pulso e respiração formam um conjunto básico de avaliação clínica."},
 {text:"Antibióticos são indicados principalmente contra:",options:["Infecções bacterianas sensíveis","Todas as viroses","Deficiências minerais","Traumas sem infecção"],correct:0,explanation:"Antibióticos atuam sobre bactérias; o uso sem indicação favorece resistência antimicrobiana."},
 {text:"O período de carência de um medicamento em animais de produção existe para:",options:["Aumentar a dose","Evitar resíduos acima do permitido nos alimentos","Reduzir ingestão de água","Substituir diagnóstico"],correct:1,explanation:"A carência garante tempo para que resíduos em leite, carne ou ovos caiam a níveis seguros."},
 {text:"Na anamnese, o veterinário busca:",options:["Histórico e informações do paciente","Apenas resultado laboratorial","Somente raça e cor","Prescrever antes do exame"],correct:0,explanation:"A anamnese reúne queixa, evolução, manejo, ambiente e antecedentes relevantes."},
 {text:"A desidratação pode ser investigada clinicamente por:",options:["Turgor cutâneo e mucosas","Somente comprimento corporal","Cor dos cascos","Número de dentes isoladamente"],correct:0,explanation:"Turgor da pele, umidade das mucosas e tempo de preenchimento capilar ajudam a estimar hidratação."},
 {text:"Qual procedimento reduz a transmissão de agentes entre pacientes?",options:["Compartilhar materiais sem limpeza","Higienização das mãos e desinfecção","Reutilizar agulhas","Misturar animais doentes e sadios"],correct:1,explanation:"Biossegurança inclui higiene, desinfecção, materiais adequados e isolamento quando necessário."},
 {text:"O hemograma avalia principalmente:",options:["Células do sangue","Estrutura óssea completa","Função renal isolada","Somente glicose"],correct:0,explanation:"O hemograma quantifica e caracteriza eritrócitos, leucócitos e plaquetas."},
 {text:"Em emergência, a sigla ABC prioriza:",options:["Via aérea, respiração e circulação","Antibiótico, banho e curativo","Alimento, balanço e casco","Anamnese, biópsia e cultura"],correct:0,explanation:"A abordagem ABC prioriza airway, breathing e circulation para estabilizar funções vitais."},
]};

export function makeStudyQuiz(niche:StudyNiche,count:number,difficulty:Difficulty="medio"){
  const ranked=studyBanks[niche].map((q,index)=>({...q,difficulty:index<3?"facil" as const:index<7?"medio" as const:"avancado" as const}));
  const preferred=ranked.filter(q=>q.difficulty===difficulty);
  const pool=preferred.length>=count?preferred:[...preferred,...ranked.filter(q=>q.difficulty!==difficulty)];
  return pool.sort(()=>Math.random()-.5).slice(0,count);
}
