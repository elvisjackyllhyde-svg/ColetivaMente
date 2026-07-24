import type {Difficulty,StudyQuestion} from "./study-banks";

export type CategoryTopic="gerais"|"entretenimento"|"musica"|"esportes"|"cultura-pop"|"infantil"|"tecnologia"|"biblia"|"empresas"|"saude"|"cultura"|"cotidiano";
type Seed=[sub:string,question:string,correct:string,wrong1:string,wrong2:string,wrong3:string,explanation:string];

export const categoryNames:Record<CategoryTopic,string>={
 gerais:"Conhecimentos Gerais",entretenimento:"Filmes e Séries",musica:"Música",esportes:"Futebol e Esportes","cultura-pop":"Cultura Pop",infantil:"Quiz Infantil",tecnologia:"Tecnologia",biblia:"Bíblia",empresas:"Profissões e Empresas",saude:"Saúde e Bem-estar",cultura:"Cultura e Sociedade",cotidiano:"Cotidiano"
};

const seeds:Record<CategoryTopic,Seed[]>={
gerais:[
 ["História","Em que país teve início o Renascimento europeu?","Itália","França","Inglaterra","Portugal","O Renascimento começou nas cidades italianas e depois se espalhou pela Europa."],
 ["Geografia","Qual é o maior oceano da Terra?","Pacífico","Atlântico","Índico","Ártico","O oceano Pacífico é o maior e mais profundo do planeta."],
 ["Ciências","Qual gás é mais abundante na atmosfera terrestre?","Nitrogênio","Oxigênio","Gás carbônico","Hidrogênio","O nitrogênio representa cerca de 78% da atmosfera."],
 ["Biologia","Qual organela é conhecida como central energética da célula?","Mitocôndria","Ribossomo","Lisossomo","Complexo de Golgi","A mitocôndria produz grande parte do ATP usado pela célula."],
 ["Química","Qual é o símbolo químico do ouro?","Au","Ag","Fe","O","Au vem do latim aurum."],
 ["Física","Qual unidade mede a força no Sistema Internacional?","Newton","Joule","Watt","Pascal","A força é medida em newtons, símbolo N."],
 ["Matemática","Quanto é 15% de 200?","30","15","20","35","Quinze por cento de 200 é 0,15 × 200 = 30."],
 ["Língua Portuguesa","Qual palavra é um pronome pessoal?","Nós","Casa","Bonito","Rapidamente","Nós é um pronome pessoal da primeira pessoa do plural."],
 ["Literatura","Quem escreveu Dom Casmurro?","Machado de Assis","José de Alencar","Clarice Lispector","Carlos Drummond","Dom Casmurro é uma obra de Machado de Assis."],
 ["Filosofia","A frase 'Só sei que nada sei' é tradicionalmente associada a quem?","Sócrates","Aristóteles","Descartes","Nietzsche","A frase resume a postura investigativa associada a Sócrates."]
],
entretenimento:[
 ["Filmes","Quem dirigiu o filme Titanic, lançado em 1997?","James Cameron","Steven Spielberg","George Lucas","Peter Jackson","James Cameron escreveu e dirigiu Titanic."],
 ["Filmes","Qual filme apresenta o personagem Simba?","O Rei Leão","Aladdin","Toy Story","Shrek","Simba é o protagonista de O Rei Leão."],
 ["Séries","Em qual cidade se passa principalmente a série Friends?","Nova York","Chicago","Los Angeles","Boston","Friends acompanha o grupo de amigos em Nova York."],
 ["Séries","Qual série acompanha a família real britânica durante várias décadas?","The Crown","Bridgerton","The Office","Lost","The Crown dramatiza diferentes períodos da monarquia britânica."],
 ["Desenhos Animados","Qual é o nome do melhor amigo de Bob Esponja?","Patrick Estrela","Lula Molusco","Seu Siriguejo","Plankton","Patrick Estrela é o melhor amigo de Bob Esponja."],
 ["Anime","Em Dragon Ball, qual é o nome do protagonista saiyajin?","Goku","Naruto","Luffy","Ichigo","Goku é o protagonista central de Dragon Ball."],
 ["Filmes","Qual objeto deve ser destruído em O Senhor dos Anéis?","O Um Anel","A Varinha das Varinhas","O Cálice de Fogo","O Tridente de Poseidon","A missão central é destruir o Um Anel na Montanha da Perdição."],
 ["Séries","Qual profissão Walter White exercia no início de Breaking Bad?","Professor de química","Advogado","Médico","Policial","Walter White era professor de química antes de entrar no crime."],
 ["Filmes","Qual estúdio criou Toy Story?","Pixar","DreamWorks","Studio Ghibli","Illumination","Toy Story foi o primeiro longa-metragem da Pixar."],
 ["Anime","Qual é o objetivo de Monkey D. Luffy em One Piece?","Tornar-se Rei dos Piratas","Ser Hokage","Encontrar as Esferas do Dragão","Vencer a Liga Pokémon","Luffy procura o One Piece para se tornar Rei dos Piratas."]
],
musica:[
 ["Instrumentos","Quantas teclas possui normalmente um piano moderno?","88","66","72","96","O piano moderno padrão possui 88 teclas."],
 ["Teoria Musical","Quantas notas naturais existem na escala musical ocidental?","7","5","8","12","As notas naturais são dó, ré, mi, fá, sol, lá e si."],
 ["Música Brasileira","Quem compôs Garota de Ipanema com Vinicius de Moraes?","Tom Jobim","Chico Buarque","Caetano Veloso","Gilberto Gil","Tom Jobim compôs a música e Vinicius escreveu a letra."],
 ["Rock","Qual banda gravou Bohemian Rhapsody?","Queen","The Beatles","Pink Floyd","U2","Bohemian Rhapsody foi lançada pelo Queen em 1975."],
 ["Música Clássica","Qual compositor continuou criando mesmo após perder grande parte da audição?","Beethoven","Mozart","Vivaldi","Chopin","Beethoven compôs obras importantes mesmo com perda auditiva severa."],
 ["Ritmos","O samba se consolidou historicamente em qual país?","Brasil","Espanha","México","Cuba","O samba é um gênero de raízes afro-brasileiras."],
 ["Instrumentos","Qual instrumento possui geralmente seis cordas?","Violão","Flauta","Trompete","Pandeiro","O violão tradicional possui seis cordas."],
 ["Voz","Como se chama a voz masculina mais grave?","Baixo","Tenor","Soprano","Contralto","Baixo é a classificação vocal masculina mais grave."],
 ["Pop","Michael Jackson ficou conhecido por qual título?","Rei do Pop","Rei do Rock","Príncipe do Jazz","Pai do Blues","Michael Jackson é amplamente chamado de Rei do Pop."],
 ["Notação Musical","Qual símbolo indica silêncio na música?","Pausa","Clave","Sustenido","Compasso","As pausas representam durações de silêncio na notação musical."]
],
esportes:[
 ["Futebol","Quantos jogadores cada equipe inicia em campo no futebol?","11","10","9","12","Cada time começa com onze jogadores, incluindo o goleiro."],
 ["Futebol","Qual cartão representa expulsão no futebol?","Vermelho","Amarelo","Azul","Verde","O cartão vermelho determina a expulsão do jogador."],
 ["Regras","Quanto dura uma partida regulamentar de futebol, sem acréscimos?","90 minutos","80 minutos","100 minutos","120 minutos","São dois tempos de 45 minutos."],
 ["Seleções","Qual seleção venceu a primeira Copa do Mundo, em 1930?","Uruguai","Brasil","Argentina","Itália","O Uruguai sediou e venceu a primeira Copa do Mundo."],
 ["Clubes","Em qual país fica o clube Barcelona?","Espanha","Itália","Portugal","França","O FC Barcelona é um clube da Catalunha, na Espanha."],
 ["Fórmula 1","O que indica a bandeira quadriculada?","Fim da corrida","Perigo na pista","Paralisação","Carro lento","A bandeira quadriculada marca o término da prova."],
 ["Basquete","Quantos pontos vale normalmente uma cesta feita além da linha de três?","3","1","2","4","Arremessos convertidos além da linha valem três pontos."],
 ["Vôlei","Quantos jogadores de cada equipe ficam em quadra no vôlei?","6","5","7","8","Seis jogadores por equipe atuam simultaneamente em quadra."],
 ["Olimpíadas","De quantos anéis é formado o símbolo olímpico?","5","4","6","7","O símbolo olímpico possui cinco anéis entrelaçados."],
 ["Futebol","Qual jogador pode usar as mãos dentro da própria área?","Goleiro","Zagueiro","Capitão","Atacante","O goleiro pode usar as mãos dentro de sua área penal."]
],
"cultura-pop":[
 ["Quadrinhos","Qual é a identidade secreta do Batman?","Bruce Wayne","Clark Kent","Peter Parker","Tony Stark","Batman é o alter ego de Bruce Wayne."],
 ["Super-heróis","De qual planeta vem o Superman?","Krypton","Asgard","Vulcano","Tatooine","Superman nasceu no planeta Krypton."],
 ["Videogames","Qual personagem da Nintendo é um encanador italiano?","Mario","Sonic","Link","Kirby","Mario é o mascote encanador da Nintendo."],
 ["Videogames","Em Minecraft, qual criatura verde explode perto do jogador?","Creeper","Enderman","Zumbi","Esqueleto","Creepers se aproximam silenciosamente e explodem."],
 ["Internet","O que significa a sigla GIF?","Graphics Interchange Format","Global Image File","Graphic Internet Frame","General Interface Format","GIF significa Graphics Interchange Format."],
 ["Ficção Científica","Em Star Wars, qual arma é usada pelos Jedi?","Sabre de luz","Tridente","Martelo mágico","Arco longo","Os Jedi usam sabres de luz."],
 ["Fantasia","Qual escola Harry Potter frequenta?","Hogwarts","Nárnia","Xavier","Nevermore","Harry estuda magia na Escola de Hogwarts."],
 ["Jogos","Qual jogo usa peças como rei, rainha, torres e bispos?","Xadrez","Damas","Dominó","Go","Essas são peças do xadrez."],
 ["Memes","Como se chama um conteúdo que se espalha rapidamente pela internet?","Viral","Offline","Analógico","Privado","Conteúdos amplamente compartilhados são chamados de virais."],
 ["Pokémon","Qual Pokémon é o companheiro mais conhecido de Ash?","Pikachu","Charmander","Mewtwo","Eevee","Pikachu acompanha Ash desde o começo da animação."]
],
infantil:[
 ["Animais","Qual animal é conhecido por ter uma tromba?","Elefante","Girafa","Leão","Coelho","O elefante usa a tromba para respirar, cheirar e manipular objetos."],
 ["Cores","Que cor resulta da mistura de azul e amarelo?","Verde","Roxo","Laranja","Rosa","Azul e amarelo formam verde na mistura de pigmentos."],
 ["Formas","Quantos lados tem um triângulo?","3","4","5","6","Todo triângulo possui três lados."],
 ["Adivinhações","O que tem dentes, mas não morde?","Pente","Cachorro","Tubarão","Jacaré","O pente possui dentes usados para arrumar o cabelo."],
 ["Escola","Qual operação é o inverso da adição?","Subtração","Multiplicação","Potenciação","Divisão","A subtração desfaz uma adição correspondente."],
 ["Natureza","Em que estação as folhas de muitas árvores caem?","Outono","Primavera","Verão","Inverno","Muitas árvores perdem folhas durante o outono."],
 ["Corpo Humano","Qual parte do corpo usamos principalmente para ouvir?","Ouvidos","Olhos","Nariz","Mãos","Os ouvidos captam os sons."],
 ["Contos","Quem perde um sapatinho de cristal no baile?","Cinderela","Branca de Neve","Chapeuzinho Vermelho","Rapunzel","Cinderela deixa um sapatinho de cristal ao fugir do baile."],
 ["Animais","Qual é o maior animal terrestre?","Elefante-africano","Girafa","Hipopótamo","Rinoceronte","O elefante-africano é o maior animal terrestre atual."],
 ["Verdadeiro ou Falso","Qual destes animais é um mamífero?","Golfinho","Tubarão","Polvo","Sardinha","O golfinho respira por pulmões e amamenta seus filhotes."]
],
tecnologia:[
 ["Informática","Qual componente executa a maior parte das instruções de um computador?","CPU","Monitor","Teclado","Gabinete","A CPU processa instruções e coordena operações."],
 ["Internet","O que significa URL?","Uniform Resource Locator","Universal Route Link","User Resource Login","Unified Record List","URL significa Uniform Resource Locator."],
 ["Segurança Digital","Qual senha é geralmente mais segura?","Uma frase longa e exclusiva","12345678","Seu primeiro nome","A mesma senha em todos os sites","Comprimento e exclusividade aumentam a segurança da senha."],
 ["Inteligência Artificial","O que é aprendizado de máquina?","Técnica em que sistemas aprendem padrões com dados","Um tipo de cabo de rede","Uma linguagem exclusiva de celulares","Um antivírus físico","Machine learning usa dados para ajustar modelos e reconhecer padrões."],
 ["Programação","Qual estrutura repete um bloco de instruções?","Laço","Variável","Comentário","Arquivo","Laços, ou loops, repetem instruções conforme uma condição."],
 ["Redes","Qual equipamento encaminha dados entre redes?","Roteador","Mouse","Scanner","Projetor","O roteador direciona pacotes entre diferentes redes."],
 ["Aplicativos","Para que serve uma atualização de aplicativo?","Corrigir falhas e adicionar melhorias","Apagar obrigatoriamente a conta","Desligar a internet","Trocar o aparelho","Atualizações podem corrigir vulnerabilidades, erros e trazer recursos."],
 ["Armazenamento","Qual unidade é maior?","Terabyte","Gigabyte","Megabyte","Kilobyte","Um terabyte corresponde a cerca de mil gigabytes no uso decimal."],
 ["Web","Qual linguagem estrutura o conteúdo de páginas web?","HTML","CSS","SQL","JPEG","HTML define a estrutura e o conteúdo semântico das páginas."],
 ["Segurança Digital","O que é phishing?","Tentativa de enganar para roubar dados","Compactação de arquivos","Aceleração de internet","Limpeza física do computador","Phishing usa mensagens ou páginas falsas para capturar informações."]
],
biblia:[
 ["Antigo Testamento","Qual é o primeiro livro da Bíblia?","Gênesis","Êxodo","Salmos","Mateus","Gênesis abre a Bíblia e o Pentateuco."],
 ["Novo Testamento","Quantos Evangelhos canônicos existem?","4","3","5","12","Os Evangelhos são Mateus, Marcos, Lucas e João."],
 ["Personagens","Quem construiu uma arca segundo o relato bíblico?","Noé","Abraão","Moisés","Davi","Noé construiu a arca antes do dilúvio."],
 ["Êxodo","Quem liderou os israelitas na saída do Egito?","Moisés","Salomão","Pedro","Paulo","Moisés liderou o Êxodo."],
 ["Reis","Quem derrotou Golias?","Davi","Sansão","Saul","Josué","Davi venceu Golias com uma funda."],
 ["Evangelhos","Em qual cidade Jesus nasceu segundo os Evangelhos?","Belém","Nazaré","Jerusalém","Roma","Os relatos de Mateus e Lucas situam o nascimento em Belém."],
 ["Apóstolos","Qual apóstolo era cobrador de impostos?","Mateus","João","Tiago","André","Mateus é apresentado como cobrador de impostos."],
 ["Cartas","Quem escreveu várias cartas do Novo Testamento?","Paulo","Pilatos","Herodes","Samuel","Diversas epístolas do Novo Testamento são atribuídas a Paulo."],
 ["Sabedoria","Qual livro reúne muitos cânticos e orações?","Salmos","Levítico","Atos","Apocalipse","Salmos é uma coletânea de cânticos, poemas e orações."],
 ["Mandamentos","Em quantas tábuas os Dez Mandamentos são tradicionalmente representados?","2","1","3","10","A tradição artística e religiosa os representa em duas tábuas."]
],
empresas:[
 ["Administração","Qual função define objetivos e caminhos para alcançá-los?","Planejamento","Improvisação","Arquivamento","Fiscalização","Planejar é estabelecer objetivos e ações."],
 ["Vendas","O que é uma necessidade do cliente?","Problema ou desejo que busca resolver","Desconto obrigatório","Meta interna do vendedor","Nome do concorrente","Entender a necessidade orienta uma oferta adequada."],
 ["Marketing","O que representa o público-alvo?","Grupo de pessoas que a oferta pretende atender","Todos os funcionários","Somente concorrentes","Apenas fornecedores","O público-alvo reúne consumidores com características relevantes para a oferta."],
 ["Finanças","O que é fluxo de caixa?","Registro de entradas e saídas de dinheiro","Lista de produtos","Escala de trabalho","Pesquisa de satisfação","Fluxo de caixa acompanha movimentações financeiras ao longo do tempo."],
 ["Contabilidade","Ativos representam principalmente o quê?","Bens e direitos","Somente dívidas","Apenas impostos","Metas de vendas","Ativos incluem recursos, bens e direitos controlados pela entidade."],
 ["Recursos Humanos","Para que serve o feedback profissional?","Orientar melhoria e reconhecer desempenho","Punir automaticamente","Substituir todo treinamento","Evitar comunicação","Feedback claro ajuda a manter e desenvolver comportamentos."],
 ["Atendimento","Qual atitude favorece um bom atendimento?","Escuta ativa","Interromper o cliente","Prometer o impossível","Ignorar dúvidas","Escuta ativa ajuda a compreender e responder corretamente."],
 ["Liderança","O que é delegar?","Atribuir responsabilidade com orientação e autonomia","Abandonar a equipe","Fazer tudo sozinho","Evitar decisões","Delegação combina responsabilidade, clareza e acompanhamento."],
 ["Segurança do Trabalho","Qual é a finalidade de um EPI?","Reduzir a exposição individual a riscos","Eliminar todo risco da empresa","Substituir treinamento","Aumentar produtividade apenas","O EPI protege o trabalhador contra riscos específicos quando corretamente usado."],
 ["Compliance","O que significa agir em conformidade?","Cumprir leis, normas e políticas aplicáveis","Ignorar controles","Ocultar problemas","Priorizar resultado a qualquer custo","Compliance busca integridade e atendimento às regras aplicáveis."]
],
saude:[
 ["Anatomia","Qual órgão bombeia sangue pelo corpo?","Coração","Pulmão","Fígado","Rim","O coração impulsiona o sangue pelo sistema circulatório."],
 ["Anatomia","Qual é o maior órgão do corpo humano?","Pele","Cérebro","Fígado","Intestino","A pele é considerada o maior órgão do corpo."],
 ["Hábitos Saudáveis","Qual hábito ajuda a prevenir a desidratação?","Beber água regularmente","Evitar líquidos o dia todo","Consumir apenas sal","Dormir menos","A ingestão regular de água ajuda a manter a hidratação."],
 ["Nutrição","Qual nutriente é a principal fonte imediata de energia na alimentação?","Carboidrato","Vitamina","Mineral","Água","Carboidratos são uma fonte energética importante para o organismo."],
 ["Primeiros Socorros","Antes de ajudar em um acidente, qual é a primeira preocupação?","Verificar se o local é seguro","Oferecer comida","Mover todos imediatamente","Fotografar a cena","A segurança da cena evita novas vítimas."],
 ["Saúde Bucal","Qual prática ajuda a remover placa entre os dentes?","Usar fio dental","Mascar gelo","Evitar água","Escovar apenas a língua","O fio dental limpa áreas que a escova pode não alcançar."],
 ["Exercícios","Qual etapa prepara gradualmente o corpo para atividade física?","Aquecimento","Jejum","Imobilização","Desidratação","O aquecimento aumenta progressivamente a demanda sobre o corpo."],
 ["Sistema Respiratório","Em qual órgão ocorre a troca de oxigênio e gás carbônico?","Pulmões","Estômago","Baço","Pâncreas","As trocas gasosas acontecem nos alvéolos pulmonares."],
 ["Prevenção","Por que lavar as mãos é importante?","Reduz a transmissão de microrganismos","Substitui vacinas","Elimina toda alergia","Impede qualquer doença","A higiene das mãos reduz a disseminação de muitos agentes infecciosos."],
 ["Sono","Qual função está associada ao sono adequado?","Recuperação física e consolidação da memória","Parar definitivamente o metabolismo","Eliminar necessidade de alimentação","Aumentar desidratação","O sono participa da recuperação e de processos de memória."]
],
cultura:[
 ["Países e Bandeiras","Qual país possui uma folha de bordo em sua bandeira?","Canadá","Japão","Brasil","Índia","A folha de bordo é o símbolo central da bandeira canadense."],
 ["Capitais","Qual é a capital da Argentina?","Buenos Aires","Santiago","Lima","Montevidéu","Buenos Aires é a capital argentina."],
 ["Tradições Brasileiras","Qual festa popular é marcada por quadrilhas e fogueiras?","Festa Junina","Carnaval","Círio de Nazaré","Oktoberfest","Festas juninas celebram santos populares com quadrilhas e fogueiras."],
 ["Religiões","Em qual cidade fica o Vaticano?","Roma","Paris","Atenas","Lisboa","O Estado da Cidade do Vaticano é um enclave em Roma."],
 ["Mitologia","Quem é o deus do trovão na mitologia nórdica?","Thor","Zeus","Anúbis","Apolo","Thor é associado ao trovão na mitologia nórdica."],
 ["Línguas","Qual é a língua oficial do Brasil?","Português","Espanhol","Inglês","Francês","O português é a língua oficial do Brasil."],
 ["Capitais","Qual é a capital do Japão?","Tóquio","Pequim","Seul","Bangkok","Tóquio é a capital japonesa."],
 ["Festas Populares","Em qual cidade brasileira acontece o famoso Festival de Parintins?","Parintins","Recife","Salvador","Ouro Preto","O festival dos bois Garantido e Caprichoso ocorre em Parintins, Amazonas."],
 ["Países","Em qual continente fica o Egito?","África","Ásia","Europa","Oceania","A maior parte do território egípcio está no nordeste da África."],
 ["Expressões","O que significa dizer que alguém 'deu uma mãozinha'?","Ajudou","Atrapalhou","Dormiu","Viajou","Dar uma mãozinha é uma expressão que significa ajudar."]
],
cotidiano:[
 ["Gastronomia","Qual ingrediente é a base do pão tradicional?","Farinha","Vinagre","Gelatina","Pimenta","A farinha fornece a estrutura principal da massa do pão."],
 ["Alimentos","Qual método conserva alimentos por baixa temperatura sem congelá-los?","Refrigeração","Fermentação","Defumação","Desidratação","A refrigeração reduz a velocidade de deterioração mantendo o alimento frio."],
 ["Trânsito","O que indica a luz vermelha do semáforo?","Pare","Acelere","Estacione","Vire sempre","A luz vermelha determina parada."],
 ["Automóveis","Qual instrumento mostra a velocidade do veículo?","Velocímetro","Odômetro","Tacômetro","Termômetro","O velocímetro indica a velocidade instantânea."],
 ["Viagens","Qual documento é normalmente exigido para viagens internacionais?","Passaporte","Carteira de biblioteca","Título de eleitor sempre","Cartão de visita","O passaporte identifica o viajante internacionalmente, sujeito às regras do destino."],
 ["Casa","Qual prática ajuda a evitar desperdício de energia?","Apagar luzes desnecessárias","Deixar aparelhos ligados sem uso","Abrir a geladeira continuamente","Usar lâmpadas queimadas","Desligar o que não está em uso reduz consumo desnecessário."],
 ["Sustentabilidade","O que significa reciclar?","Transformar resíduos em novos materiais ou produtos","Misturar todo o lixo","Queimar plástico a céu aberto","Descartar em rios","Reciclagem reprocessa materiais para novo uso."],
 ["Meio Ambiente","Qual fonte de energia é renovável?","Solar","Carvão mineral","Petróleo","Gás natural","A energia solar utiliza uma fonte continuamente renovada."],
 ["Organização","Qual prática facilita encontrar objetos em casa?","Definir um lugar para cada item","Mudar tudo de lugar diariamente","Acumular embalagens","Não usar etiquetas","Locais definidos reduzem tempo de procura e desordem."],
 ["Turismo","O que é um roteiro de viagem?","Plano de locais e atividades da viagem","Documento de propriedade","Tipo de combustível","Seguro obrigatório universal","O roteiro organiza destinos, deslocamentos e atividades."]
]};

function variantQuestion(seed:Seed,variant:number,difficulty:Difficulty):StudyQuestion{
 const [sub,question,correct,...rest]=seed; const wrong=rest.slice(0,3); const explanation=rest[3];
 const wording=[question,`Em ${sub}, assinale a alternativa correta: ${question}`,`Desafio de ${sub}: ${question}`,`Marque a resposta correta — ${question}`][variant];
 const raw=[correct,...wrong]; const shift=variant%4; const options=[...raw.slice(shift),...raw.slice(0,shift)];
 return {text:wording,options,correct:options.indexOf(correct),explanation,difficulty};
}

export function getCategoryBank(topic:CategoryTopic):StudyQuestion[]{
 return seeds[topic].flatMap((seed,index)=>[0,1,2,3].map(variant=>variantQuestion(seed,variant,index<3?"facil":index<7?"medio":"avancado")));
}

export function makeCategoryQuiz(topic:CategoryTopic,count:number,difficulty:Difficulty):StudyQuestion[]{
 const source=seeds[topic].map((seed,index)=>({seed,index,difficulty:index<3?"facil" as const:index<7?"medio" as const:"avancado" as const}));
 const preferred=source.filter(item=>item.difficulty===difficulty).sort(()=>Math.random()-.5);
 const rest=source.filter(item=>item.difficulty!==difficulty).sort(()=>Math.random()-.5);
 return [...preferred,...rest].slice(0,count).map(item=>variantQuestion(item.seed,Math.floor(Math.random()*4),item.difficulty));
}
