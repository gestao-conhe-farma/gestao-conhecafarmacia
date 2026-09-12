import { exigirUtilizador } from '@/lib/supabase/server'

export const metadata = { title: 'Guia da plataforma' }

/**
 * Guia completo da plataforma, dentro da app. Fonte única: a mesma
 * versão publicada como anúncio remete para cá. Conteúdo estático —
 * atualiza-se editando esta página.
 */
export default async function PaginaGuia() {
  await exigirUtilizador()

  return (
    <div className="container-app max-w-3xl">
      <div className="page-head">
        <p className="kicker">Equipa</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-deep mt-2 tracking-tight">
          Guia da plataforma
        </h1>
        <p className="text-brand-deep/60 mt-2 max-w-xl leading-relaxed">
          O essencial para trabalhares com a app no dia a dia. Dúvidas ou
          algo estranho? Fala com a coordenação.
        </p>
      </div>

      <article className="max-w-2xl text-[14.5px] leading-relaxed text-brand-deep/85 space-y-10 mt-8">
        <Secao titulo="1. Acessos e segurança">
          <p>
            <strong>Entrar:</strong> email + palavra-passe. Com 2FA ativa,
            aparece o campo do código de 6 dígitos depois da palavra-passe.
            Com passkey registada (impressão digital / Face ID / Windows
            Hello), podes entrar com ela no botão de login.
          </p>
          <p>
            <strong>Sessão:</strong> termina após 30 minutos sem uso ou 4
            horas no máximo, mesmo com atividade. Basta voltar a entrar.
          </p>
          <p>
            <strong>Instalar como app:</strong> Android (Chrome/Edge: menu →
            Instalar aplicação) e iPhone (Safari: Partilhar → Adicionar ao
            Ecrã Principal). Fica com ícone próprio e abre sem barra do
            browser.
          </p>
          <p>
            <strong>Tema claro/escuro:</strong> no menu lateral (junto ao
            perfil) no mobile, ou na barra do topo no desktop.
          </p>
        </Secao>

        <Secao titulo="2. Quem faz o quê">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="text-left text-brand-deep/50">
                  <th className="py-2 pr-4 font-semibold"></th>
                  <th className="py-2 pr-4 font-semibold">Coordenação</th>
                  <th className="py-2 font-semibold">Membro</th>
                </tr>
              </thead>
              <tbody className="align-top">
                <tr className="border-t border-brand-divider">
                  <td className="py-2.5 pr-4 font-semibold text-brand-deep">Atividades e subtarefas</td>
                  <td className="py-2.5 pr-4">Criar, aprovar, concluir</td>
                  <td className="py-2.5">Atualizar as suas, concluir as atribuídas</td>
                </tr>
                <tr className="border-t border-brand-divider">
                  <td className="py-2.5 pr-4 font-semibold text-brand-deep">Reuniões</td>
                  <td className="py-2.5 pr-4">Criar, convocar, publicar ata</td>
                  <td className="py-2.5">Confirmar presença, participar</td>
                </tr>
                <tr className="border-t border-brand-divider">
                  <td className="py-2.5 pr-4 font-semibold text-brand-deep">Entidades, Profissionais, Documentos</td>
                  <td className="py-2.5 pr-4">Criar e gerir</td>
                <td className="py-2.5">Consultar</td>
                </tr>
                <tr className="border-t border-brand-divider">
                  <td className="py-2.5 pr-4 font-semibold text-brand-deep">Anúncios</td>
                  <td className="py-2.5 pr-4">Publicar</td>
                  <td className="py-2.5">Ler</td>
                </tr>
                <tr className="border-t border-brand-divider">
                  <td className="py-2.5 pr-4 font-semibold text-brand-deep">Conteúdo das redes</td>
                  <td className="py-2.5 pr-4">Planear</td>
                  <td className="py-2.5">Consultar</td>
                </tr>
              </tbody>
            </table>
        </div>
        </Secao>

        <Secao titulo="3. A homepage (Início)">
          <p>
            Mostra, por ordem: anúncio mais recente da coordenação, próxima
            reunião, o que está a acontecer por data, tarefas aprovadas, o
            que está em atraso, decisões à espera de virar atividade e o
            conteúdo que sai nas redes esta semana. O calendário de prazos
            no fundo junta tudo — atividades, tarefas e reuniões.
          </p>
        </Secao>

        <Secao titulo="4. Atividades, eventos e entrevistas">
          <p>
            Três tipos de trabalho: atividade (tarefa da equipa), evento
            (palestra, congresso, workshop) e entrevista (TV/rádio/media).
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              Cada página tem detalhes, responsáveis, materiais e subtarefas.
              Subtarefas criadas pela coordenação passam por aprovação — o
              responsável aceita, recusa (com justificação) ou devolve.
            </li>
            <li>
              O responsável atualiza o estado: concluída, cancelada ou erro
              (com caixa de relatório a explicar o que aconteceu).
            </li>
            <li>
              <strong>Concluir uma atividade</strong> — botão no fundo da
              página; quem pode: a coordenação e os responsáveis atribuídos.
            </li>
            <li>
              <strong>Conversa</strong> — cada atividade tem o seu chat no
              fundo da página para coordenar sem sair do contexto.
            </li>
            <li>
              <strong>Entrevistas:</strong> convites aparecem em As minhas
              entrevistas com badge — confirma aí a tua disponibilidade.
            </li>
          </ul>
        </Secao>

        <Secao titulo="5. Reuniões">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Convite:</strong> chega notificação (e email); confirma
              presença na página da reunião.
            </li>
            <li>
              A ata é publicada pela coordenação no fim e fica congelada
              (histórico imutável), com download em Word e PDF.
            </li>
            <li>
              <strong>Resumo como anúncio:</strong> ao publicar a ata, a
              coordenação pode marcar Publicar também como anúncio — o
              resumo chega a toda a equipa.
            </li>
            <li>
              <strong>Reuniões privadas:</strong> algumas reuniões são só da
              coordenação; quem não foi convocado simplesmente não as vê.
            </li>
          </ul>
        </Secao>

        <Secao titulo="6. Conversas (mensagens diretas)">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              Em Conversas vês as tuas conversas com cada membro e podes
              começar novas (também pelo botão no perfil de alguém, em
              Equipa).
            </li>
            <li>
              Cada mensagem nova gera notificação, e o item Conversas no
              menu mostra quantas tens por ler. Os ✓/✓✓ nas tuas mensagens
              indicam enviada / lida.
            </li>
            <li>
              A conversa sobre trabalho concreto vive dentro da atividade ou
              reunião — as DMs são para o resto.
            </li>
          </ul>
        </Secao>

        <Secao titulo="7. Anúncios, parcerias e documentos">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Anúncios</strong> (ícone de megafone na barra do topo):
              comunicados da coordenação para toda a equipa, com notificação
              e email. O mais recente fica destacado na homepage.
            </li>
            <li>
              <strong>Parcerias</strong> (menu): Entidades — empresas e
              instituições de saúde/farmácia com que trabalhamos — e
              Profissionais — a lista de especialistas convidáveis para
              entrevistas, com histórico de participações.
            </li>
            <li>
              <strong>Documentos:</strong> arquivo da equipa, gerido pela
              coordenação.
            </li>
          </ul>
        </Secao>

        <Secao titulo="8. Notificações">
          <p>
            O sino mostra tudo o que te diz respeito: convites, tarefas
            atribuídas, mensagens, atas publicadas, anúncios. Cada tipo tem
            uma cor. Clica para ir direto ao que interessa — e Marcar todas
            como lidas quando quiseres pôr a casa em ordem.
          </p>
        </Secao>

        <Secao titulo="9. Definições">
          <p>
            Em Definições: mudar palavra-passe, ativar a 2FA (recomendado!),
            gerir passkeys (dispositivos com biometria) e terminar sessões.
          </p>
        </Secao>

        <Secao titulo="10. Boas práticas">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Confirma presenças nas reuniões — a coordenação planeia com esses números.</li>
            <li>Mantém os estados atualizados das tuas tarefas; erro existe para dizer honestamente que algo não seguiu, com o relatório a explicar.</li>
            <li>Usa a conversa da atividade em vez de espalhar por DMs — fica histórico para quem chega depois.</li>
            <li>Contribui para Profissionais e Entidades — sugere à coordenação novos contactos que valham a pena registar.</li>
            <li>Dúvidas ou algo estranho na app? Fala com a coordenação.</li>
          </ol>
        </Secao>

        <Secao titulo="Problemas comuns">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Não é possível abrir esta conversa</strong> — estás a
              tentar abrir uma conversa contigo próprio; usa o menu Conversas
              para escolher o membro.
            </li>
            <li>
              <strong>Uma reunião deu 404</strong> — se for da coordenação
              (privada), é normal: não é para ti.
            </li>
            <li>
              <strong>Fui desligado subitamente</strong> — passaram os 30
              minutos de inatividade ou as 4 horas de sessão; volta a entrar.
            </li>
            <li>
              <strong>A página parece velha</strong> — atualiza (F5); a app
              não cacheia dados, mas o browser pode teimosamente.
            </li>
          </ul>
        </Secao>
      </article>
    </div>
  )
}

function Secao({ titulo, children }) {
  return (
    <section className="border-t border-brand-divider pt-6">
      <h2 className="text-lg font-bold text-brand-deep tracking-tight mb-3">{titulo}</h2>
      <div className="space-y-2.5">{children}</div>
    </section>
 )
}
